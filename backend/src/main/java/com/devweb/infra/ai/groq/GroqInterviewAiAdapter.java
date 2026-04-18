package com.devweb.infra.ai.groq;

import com.devweb.common.UpstreamRateLimitException;
import com.devweb.domain.resume.session.port.InterviewAiPort;
import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import com.devweb.domain.studyquiz.session.port.CsQuizAiPort;
import com.devweb.infra.ai.AiMetrics;
import com.devweb.infra.ai.AiPromptBuilder;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Groq API 어댑터 (OpenAI 호환 엔드포인트).
 * application.yml에서 devweb.ai.provider=groq 로 설정하면 활성화된다.
 */
@Component
@ConditionalOnProperty(name = "devweb.ai.provider", havingValue = "groq")
public class GroqInterviewAiAdapter implements InterviewAiPort, CsQuizAiPort {

    private static final Logger log = LoggerFactory.getLogger(GroqInterviewAiAdapter.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final AiMetrics aiMetrics;

    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final int requestTimeoutSeconds;
    private final int maxOutputTokens;

    public GroqInterviewAiAdapter(
            ObjectMapper objectMapper,
            AiMetrics aiMetrics,
            @Value("${devweb.groq.api-key:}") String apiKey,
            @Value("${devweb.groq.model:llama-3.3-70b-versatile}") String model,
            @Value("${devweb.groq.base-url:https://api.groq.com}") String baseUrl,
            @Value("${devweb.groq.request-timeout-seconds:60}") int requestTimeoutSeconds,
            @Value("${devweb.groq.max-output-tokens:4096}") int maxOutputTokens
    ) {
        this.objectMapper = objectMapper;
        this.aiMetrics = aiMetrics;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
        this.requestTimeoutSeconds = requestTimeoutSeconds;
        this.maxOutputTokens = Math.max(256, maxOutputTokens);
    }

    // ===== InterviewAiPort =====

    @Override
    public List<GeneratedQuestion> generateQuestions(String systemInstruction, String resumeText, String portfolioText, String portfolioUrl, List<String> targetTechnologies) {
        requireApiKey();
        String prompt = AiPromptBuilder.buildQuestionsPrompt(resumeText, portfolioText, portfolioUrl, targetTechnologies);
        return doGenerateQuestions(systemInstruction, prompt);
    }

    @Override
    public List<GeneratedQuestion> generateQuestionsWithHistory(String systemInstruction, String resumeText, String portfolioText, String portfolioUrl, List<String> targetTechnologies, List<String> previousQuestions) {
        requireApiKey();
        String prompt = AiPromptBuilder.buildQuestionsPromptWithHistory(resumeText, portfolioText, portfolioUrl, targetTechnologies, previousQuestions);
        return doGenerateQuestions(systemInstruction, prompt);
    }

    private List<GeneratedQuestion> doGenerateQuestions(String systemInstruction, String prompt) {
        JsonNode json = generateStructuredJsonWithRetry(systemInstruction, prompt, RetryProfile.QUESTIONS);
        JsonNode questions = json.get("questions");
        if (questions == null || !questions.isArray()) {
            throw new IllegalStateException("Groq 응답에 questions 배열이 없습니다. 실제 응답: " + json);
        }
        return objectMapper.convertValue(
                questions,
                objectMapper.getTypeFactory().constructCollectionType(List.class, GeneratedQuestion.class)
        );
    }

    @Override
    public InterviewAiPort.GeneratedFeedback generateFeedback(String systemInstruction, String question, String intention, String keywords, String modelAnswer, String answerText) {
        requireApiKey();
        String prompt = AiPromptBuilder.buildFeedbackPrompt(question, intention, keywords, modelAnswer, answerText);
        JsonNode json = generateStructuredJsonWithRetry(systemInstruction, prompt, RetryProfile.FEEDBACK);
        return parseFeedbackAsInterview(json);
    }

    // ===== CsQuizAiPort =====

    @Override
    public List<CsQuizAiPort.GeneratedQuizQuestion> generateQuestions(
            String systemInstruction,
            Set<CsQuizTopic> topics,
            CsQuizDifficulty difficulty,
            int multipleChoiceCount,
            int shortAnswerCount
    ) {
        requireApiKey();
        if (topics == null || topics.isEmpty()) throw new IllegalArgumentException("topics는 1개 이상 필요합니다.");
        if (difficulty == null) throw new IllegalArgumentException("difficulty는 필수입니다.");
        if (multipleChoiceCount < 0 || shortAnswerCount < 0) throw new IllegalArgumentException("count는 0 이상이어야 합니다.");

        List<CsQuizAiPort.GeneratedQuizQuestion> out = new ArrayList<>();
        if (multipleChoiceCount > 0) {
            out.addAll(generateQuizQuestionsInBatches(systemInstruction, topics, difficulty, CsQuizQuestionType.MULTIPLE_CHOICE, multipleChoiceCount));
        }
        if (shortAnswerCount > 0) {
            out.addAll(generateQuizQuestionsInBatches(systemInstruction, topics, difficulty, CsQuizQuestionType.SHORT_ANSWER, shortAnswerCount));
        }
        return out;
    }

    private List<CsQuizAiPort.GeneratedQuizQuestion> generateQuizQuestionsInBatches(
            String systemInstruction,
            Set<CsQuizTopic> topics,
            CsQuizDifficulty difficulty,
            CsQuizQuestionType type,
            int totalCount
    ) {
        int remaining = totalCount;
        List<CsQuizAiPort.GeneratedQuizQuestion> out = new ArrayList<>();
        while (remaining > 0) {
            int batch = Math.min(3, remaining);
            String prompt = AiPromptBuilder.buildCsQuizQuestionsPrompt(topics, difficulty, type, batch);
            JsonNode json = generateStructuredJsonWithRetry(systemInstruction, prompt, RetryProfile.QUIZ_QUESTIONS);
            JsonNode questions = json.get("questions");
            if (questions == null || !questions.isArray()) {
                throw new IllegalStateException("Groq 응답에 questions 배열이 없습니다.");
            }
            List<CsQuizAiPort.GeneratedQuizQuestion> got = objectMapper.convertValue(
                    questions,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, CsQuizAiPort.GeneratedQuizQuestion.class)
            );
            out.addAll(got);
            remaining -= got.size();
            if (got.isEmpty()) break;
        }
        if (out.size() < totalCount) {
            throw new IllegalStateException("Groq가 CS 문제를 충분히 생성하지 못했습니다. need=" + totalCount + " got=" + out.size());
        }
        return out.subList(0, totalCount);
    }

    @Override
    public CsQuizAiPort.GeneratedFeedback generateMultipleChoiceFeedback(
            String systemInstruction,
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            String question,
            List<String> choices,
            int correctChoiceIndex,
            int selectedChoiceIndex
    ) {
        requireApiKey();
        String prompt = AiPromptBuilder.buildCsMultipleChoiceFeedbackPrompt(topic, difficulty, question, choices, correctChoiceIndex, selectedChoiceIndex);
        JsonNode json = generateStructuredJsonWithRetry(systemInstruction, prompt, RetryProfile.FEEDBACK);
        return parseFeedbackAsQuiz(json);
    }

    @Override
    public CsQuizAiPort.GeneratedFeedback generateShortAnswerFeedback(
            String systemInstruction,
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            String question,
            String referenceAnswer,
            List<String> rubricKeywords,
            String userAnswer
    ) {
        requireApiKey();
        String prompt = AiPromptBuilder.buildCsShortAnswerFeedbackPrompt(topic, difficulty, question, referenceAnswer, rubricKeywords, userAnswer);
        JsonNode json = generateStructuredJsonWithRetry(systemInstruction, prompt, RetryProfile.FEEDBACK);
        return parseFeedbackAsQuiz(json);
    }

    // ===== Session Report =====

    @Override
    public InterviewAiPort.GeneratedSessionReport generateSessionReport(String systemInstruction, String sessionData) {
        requireApiKey();
        String prompt = AiPromptBuilder.buildSessionReportPrompt(sessionData);
        JsonNode json = generateStructuredJsonWithRetry(systemInstruction, prompt, RetryProfile.SESSION_REPORT);
        try {
            return objectMapper.treeToValue(json, InterviewAiPort.GeneratedSessionReport.class);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Groq 세션 리포트 응답 파싱에 실패했습니다.", e);
        }
    }

    @Override
    public InterviewAiPort.GeneratedCoachingReport generateCoachingReport(String systemInstruction, String coachingData) {
        requireApiKey();
        String prompt = AiPromptBuilder.buildCoachingReportPrompt(coachingData);
        JsonNode json = generateStructuredJsonWithRetry(systemInstruction, prompt, RetryProfile.COACHING);
        try {
            return objectMapper.treeToValue(json, InterviewAiPort.GeneratedCoachingReport.class);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Groq 코칭 리포트 응답 파싱에 실패했습니다.", e);
        }
    }

    // ===== Retry & HTTP =====

    private enum RetryProfile { QUESTIONS, QUIZ_QUESTIONS, FEEDBACK, SESSION_REPORT, COACHING }

    private JsonNode generateStructuredJsonWithRetry(String systemInstruction, String userPrompt, RetryProfile profile) {
        log.debug("Groq API 호출 시작: profile={}", profile);
        Timer.Sample timerSample = aiMetrics.startTimer();
        IllegalStateException last = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            String enrichedSystemInstruction = buildEnrichedSystemInstruction(systemInstruction, attempt, profile);
            try {
                JsonNode result = callGroq(enrichedSystemInstruction, userPrompt);
                aiMetrics.recordSuccess(timerSample, "groq", profile.name());
                log.info("Groq API 호출 완료: profile={}", profile);
                return result;
            } catch (IllegalStateException e) {
                String msg = e.getMessage() == null ? "" : e.getMessage();
                boolean isJsonFailure = msg.contains("JSON 파싱에 실패") || msg.contains("JSON 텍스트를 찾지 못했습니다");
                if (!isJsonFailure) throw e;
                aiMetrics.recordRetry("groq", profile.name());
                log.warn("Groq JSON 파싱 실패, 재시도: attempt={}", attempt);
                last = e;
            }
        }
        throw last == null ? new IllegalStateException("Groq structured JSON 생성에 실패했습니다.") : last;
    }

    private String buildEnrichedSystemInstruction(String base, int attempt, RetryProfile profile) {
        String enriched = (base == null ? "" : base) + "\n" + AiPromptBuilder.JSON_FORMAT_RULES;
        return switch (attempt) {
            case 1 -> enriched;
            case 2 -> enriched + retryRulesAttempt2(profile);
            default -> enriched + retryRulesAttempt3(profile);
        };
    }

    private JsonNode callGroq(String systemInstruction, String userPrompt) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemInstruction == null ? "" : systemInstruction),
                Map.of("role", "user", "content", userPrompt)
        ));
        body.put("response_format", Map.of("type", "json_object"));
        body.put("temperature", 0.2);
        body.put("max_tokens", maxOutputTokens);

        String endpoint = baseUrl.replaceAll("/+$", "") + "/openai/v1/chat/completions";
        HttpResponse<byte[]> resp = postJson(endpoint, body);

        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            String bodyStr = new String(resp.body() == null ? new byte[0] : resp.body(), StandardCharsets.UTF_8);
            if (resp.statusCode() == 429) {
                int retryAfter = extractRetryAfterSeconds(resp);
                aiMetrics.recordRateLimit("groq");
                log.warn("Groq rate limit: retryAfter={}s", retryAfter);
                throw new UpstreamRateLimitException(
                        "Groq 호출 제한(429). 잠시 후 다시 시도하세요. body=" + truncate(bodyStr, 2000),
                        retryAfter
                );
            }
            throw new IllegalStateException("Groq 호출 실패. status=" + resp.statusCode() + " body=" + truncate(bodyStr, 2000));
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(resp.body());
        } catch (IOException e) {
            throw new IllegalStateException("Groq 응답 JSON 파싱에 실패했습니다.", e);
        }

        JsonNode contentNode = root.at("/choices/0/message/content");
        if (contentNode.isMissingNode() || contentNode.isNull()) {
            throw new IllegalStateException("Groq 응답에서 JSON 텍스트를 찾지 못했습니다.");
        }

        String raw = extractJsonObject(contentNode.asText());
        try {
            return objectMapper.readTree(raw);
        } catch (IOException e) {
            String finishReason = root.at("/choices/0/finish_reason").asText("unknown");
            throw new IllegalStateException("Groq structured JSON 파싱에 실패했습니다. finish_reason=" + finishReason + " raw=" + truncate(raw, 2000), e);
        }
    }

    private HttpResponse<byte[]> postJson(String url, Map<String, Object> body) {
        String json;
        try {
            json = objectMapper.writeValueAsString(body);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("요청 JSON 직렬화에 실패했습니다.", e);
        }

        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(Math.max(10, requestTimeoutSeconds)))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                .build();

        try {
            return httpClient.send(req, HttpResponse.BodyHandlers.ofByteArray());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Groq 요청이 중단되었습니다.", e);
        } catch (IOException e) {
            throw new IllegalStateException("Groq 요청 전송에 실패했습니다.", e);
        }
    }

    // ===== Parsing =====

    private record FeedbackPayload(
            List<String> strengths,
            List<String> improvements,
            String suggestedAnswer,
            List<String> followups
    ) {}

    private InterviewAiPort.GeneratedFeedback parseFeedbackAsInterview(JsonNode json) {
        try {
            FeedbackPayload p = objectMapper.treeToValue(json, FeedbackPayload.class);
            return new InterviewAiPort.GeneratedFeedback(p.strengths(), p.improvements(), p.suggestedAnswer(), p.followups());
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Groq 피드백 응답 파싱에 실패했습니다.", e);
        }
    }

    private CsQuizAiPort.GeneratedFeedback parseFeedbackAsQuiz(JsonNode json) {
        try {
            FeedbackPayload p = objectMapper.treeToValue(json, FeedbackPayload.class);
            return new CsQuizAiPort.GeneratedFeedback(p.strengths(), p.improvements(), p.suggestedAnswer(), p.followups());
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Groq 피드백 응답 파싱에 실패했습니다.", e);
        }
    }

    // ===== Retry rules =====

    private static String retryRulesAttempt2(RetryProfile profile) {
        return switch (profile) {
            case QUESTIONS -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - 질문은 정확히 4개만 출력하세요.
                    - modelAnswer는 350자 이내로 매우 짧게 작성하세요.
                    - intention은 200자 이내로 짧게 작성하세요.
                    - keywords는 120자 이내로 짧게 작성하세요.
                    """;
            case QUIZ_QUESTIONS -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - referenceAnswer는 더 짧게 작성하세요.
                    - rubricKeywords 개수를 줄이세요.
                    """;
            case FEEDBACK -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - strengths/improvements는 최대 3개로 제한하세요.
                    - suggestedAnswer는 500자 이내로 짧게 작성하세요.
                    - followups는 최대 2개로 제한하세요.
                    """;
            case SESSION_REPORT -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - executiveSummary는 300자 이내로 짧게 작성하세요.
                    - topImprovements는 정확히 3개로 유지하세요.
                    - closingAdvice는 200자 이내로 짧게 작성하세요.
                    """;
            case COACHING -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - overallAssessment는 400자 이내로 짧게 작성하세요.
                    - growthTrajectory는 400자 이내로 짧게 작성하세요.
                    - learningPlan은 정확히 3개로 제한하세요.
                    - nextSteps는 300자 이내로 짧게 작성하세요.
                    """;
        };
    }

    private static String retryRulesAttempt3(RetryProfile profile) {
        return switch (profile) {
            case QUESTIONS -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - 질문은 정확히 3개만 출력하세요.
                    - modelAnswer는 반드시 빈 문자열("")로 출력하세요. (출력 길이 최우선)
                    - intention은 140자 이내로 아주 짧게 작성하세요.
                    - keywords는 90자 이내로 아주 짧게 작성하세요.
                    """;
            case QUIZ_QUESTIONS -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - prompt/referenceAnswer를 아주 짧게 작성하세요.
                    - rubricKeywords는 3개 이하로 작성하세요.
                    """;
            case FEEDBACK -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - strengths/improvements는 최대 2개로 제한하세요.
                    - suggestedAnswer는 250자 이내로 아주 짧게 작성하세요.
                    - followups는 최대 1개로 제한하세요.
                    """;
            case SESSION_REPORT -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - executiveSummary는 200자 이내로 아주 짧게 작성하세요.
                    - badgeSummary의 strengths/weaknesses는 최대 2개로 제한하세요.
                    - topImprovements는 정확히 3개, description은 150자 이내로 아주 짧게 작성하세요.
                    - closingAdvice는 150자 이내로 아주 짧게 작성하세요.
                    """;
            case COACHING -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - overallAssessment는 300자 이내로 아주 짧게 작성하세요.
                    - growthTrajectory는 300자 이내로 아주 짧게 작성하세요.
                    - persistentStrengths/persistentWeaknesses는 각 최대 3개로 제한하세요.
                    - learningPlan은 정확히 3개, action은 150자 이내로 아주 짧게 작성하세요.
                    - nextSteps는 200자 이내로 아주 짧게 작성하세요.
                    """;
        };
    }

    // ===== Utilities =====

    private void requireApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Groq API key가 설정되지 않았습니다. env 또는 application.yml에 devweb.groq.api-key를 설정하세요.");
        }
    }

    private static String extractJsonObject(String raw) {
        if (raw == null) return "{}";
        String s = raw.trim();
        if (s.startsWith("{") && s.endsWith("}")) return s;
        int first = s.indexOf('{');
        int last = s.lastIndexOf('}');
        if (first >= 0 && last > first) return s.substring(first, last + 1);
        return s;
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    private static int extractRetryAfterSeconds(HttpResponse<byte[]> resp) {
        return resp.headers().firstValue("Retry-After")
                .or(() -> resp.headers().firstValue("x-ratelimit-reset-requests"))
                .map(v -> {
                    try { return Integer.parseInt(v.trim()); } catch (NumberFormatException e) { return -1; }
                })
                .orElse(-1);
    }
}
