package com.devweb.infra.ai.gemini;

import com.devweb.domain.resume.session.port.InterviewAiPort;
import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import com.devweb.domain.studyquiz.session.port.CsQuizAiPort;
import com.devweb.common.UpstreamRateLimitException;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@ConditionalOnProperty(name = "devweb.ai.provider", havingValue = "gemini", matchIfMissing = true)
public class GeminiInterviewAiAdapter implements InterviewAiPort, CsQuizAiPort {

    private static final Logger log = LoggerFactory.getLogger(GeminiInterviewAiAdapter.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final AiMetrics aiMetrics;

    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final int requestTimeoutSeconds;
    private final int maxOutputTokens;

    public GeminiInterviewAiAdapter(
            ObjectMapper objectMapper,
            AiMetrics aiMetrics,
            @Value("${devweb.gemini.api-key:}") String apiKey,
            @Value("${devweb.gemini.model:gemini-2.5-flash}") String model,
            @Value("${devweb.gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
            @Value("${devweb.gemini.request-timeout-seconds:90}") int requestTimeoutSeconds,
            @Value("${devweb.gemini.max-output-tokens:8192}") int maxOutputTokens
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
        Map<String, Object> schema = questionResponseSchema();

        JsonNode json = generateStructuredJsonWithRetry(systemInstruction, prompt, schema, RetryProfile.QUESTIONS);
        JsonNode questions = json.get("questions");
        if (questions == null || !questions.isArray()) {
            throw new IllegalStateException("Gemini 응답에 questions 배열이 없습니다.");
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
        Map<String, Object> schema = feedbackResponseSchema();

        JsonNode json = generateStructuredJsonWithRetry(systemInstruction, prompt, schema, RetryProfile.FEEDBACK);
        FeedbackPayload payload = parseFeedbackPayload(json);
        return new InterviewAiPort.GeneratedFeedback(payload.strengths(), payload.improvements(), payload.suggestedAnswer(), payload.followups());
    }

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

        List<CsQuizAiPort.GeneratedQuizQuestion> out = new java.util.ArrayList<>();
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
        List<CsQuizAiPort.GeneratedQuizQuestion> out = new java.util.ArrayList<>();
        while (remaining > 0) {
            int batch = Math.min(3, remaining);
            String prompt = AiPromptBuilder.buildCsQuizQuestionsPrompt(topics, difficulty, type, batch);
            JsonNode json = generateStructuredJsonWithRetry(systemInstruction, prompt, csQuizQuestionResponseSchema(), RetryProfile.QUIZ_QUESTIONS);
            JsonNode questions = json.get("questions");
            if (questions == null || !questions.isArray()) {
                throw new IllegalStateException("Gemini 응답에 questions 배열이 없습니다.");
            }
            List<CsQuizAiPort.GeneratedQuizQuestion> got = objectMapper.convertValue(
                    questions,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, CsQuizAiPort.GeneratedQuizQuestion.class)
            );
            out.addAll(got);
            remaining -= got.size();
            if (got.size() == 0) break;
        }
        if (out.size() < totalCount) {
            throw new IllegalStateException("Gemini가 CS 문제를 충분히 생성하지 못했습니다. need=" + totalCount + " got=" + out.size());
        }
        return out.subList(0, totalCount);
    }

    private static Map<String, Object> csQuizQuestionResponseSchema() {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("type", "object");
        item.put("properties", Map.of(
                "topic", Map.of("type", "string"),
                "difficulty", Map.of("type", "string"),
                "type", Map.of("type", "string"),
                "prompt", Map.of("type", "string"),
                "choices", Map.of("type", "array", "items", Map.of("type", "string")),
                "correctChoiceIndex", Map.of("type", "integer"),
                "referenceAnswer", Map.of("type", "string"),
                "rubricKeywords", Map.of("type", "array", "items", Map.of("type", "string"))
        ));
        item.put("required", List.of("topic", "difficulty", "type", "prompt", "choices", "correctChoiceIndex", "referenceAnswer", "rubricKeywords"));

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", Map.of(
                "questions", Map.of(
                        "type", "array",
                        "items", item,
                        "minItems", 1
                )
        ));
        schema.put("required", List.of("questions"));
        return schema;
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
        JsonNode json = generateStructuredJsonWithRetry(systemInstruction, prompt, feedbackResponseSchema(), RetryProfile.FEEDBACK);
        FeedbackPayload payload = parseFeedbackPayload(json);
        return new CsQuizAiPort.GeneratedFeedback(payload.strengths(), payload.improvements(), payload.suggestedAnswer(), payload.followups());
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
        JsonNode json = generateStructuredJsonWithRetry(systemInstruction, prompt, feedbackResponseSchema(), RetryProfile.FEEDBACK);
        FeedbackPayload payload = parseFeedbackPayload(json);
        return new CsQuizAiPort.GeneratedFeedback(payload.strengths(), payload.improvements(), payload.suggestedAnswer(), payload.followups());
    }

    private enum RetryProfile {
        QUESTIONS,
        QUIZ_QUESTIONS,
        FEEDBACK
    }

    private JsonNode generateStructuredJsonWithRetry(
            String systemInstruction,
            String userPrompt,
            Map<String, Object> responseSchema,
            RetryProfile profile
    ) {
        log.debug("Gemini API 호출 시작: profile={}", profile);
        Timer.Sample timerSample = aiMetrics.startTimer();
        IllegalStateException last = null;

        // attempt 1: original prompt
        // attempt 2/3: shorter + strict formatting
        for (int attempt = 1; attempt <= 3; attempt++) {
            String prompt = switch (attempt) {
                case 1 -> userPrompt;
                case 2 -> userPrompt + retryRulesAttempt2(profile);
                default -> userPrompt + retryRulesAttempt3(profile);
            };

            try {
                int tokens = maxOutputTokens;
                JsonNode result = generateStructuredJson(systemInstruction, prompt, responseSchema, tokens);
                aiMetrics.recordSuccess(timerSample, "gemini", profile.name());
                log.info("Gemini API 호출 완료: profile={}", profile);
                return result;
            } catch (IllegalStateException e) {
                String msg = e.getMessage() == null ? "" : e.getMessage();
                boolean isJsonFailure = msg.contains("structured JSON 파싱에 실패") || msg.contains("JSON 텍스트를 찾지 못했습니다");
                if (!isJsonFailure) throw e;
                aiMetrics.recordRetry("gemini", profile.name());
                log.warn("Gemini JSON 파싱 실패, 재시도: attempt={}", attempt);
                last = e;
            }
        }

        throw last == null ? new IllegalStateException("Gemini structured JSON 생성에 실패했습니다.") : last;
    }

    private static String retryRulesAttempt2(RetryProfile profile) {
        return switch (profile) {
            case QUESTIONS -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
                    - 문자열 값에는 줄바꿈을 넣지 마세요(필요하면 \\n 으로 escape).
                    - 문자열 값 안에는 큰따옴표(") 문자를 넣지 마세요(필요하면 괄호나 작은따옴표로 표현).
                    - 질문은 정확히 4개만 출력하세요.
                    - modelAnswer는 350자 이내로 매우 짧게 작성하세요.
                    - intention은 200자 이내로 짧게 작성하세요.
                    - keywords는 120자 이내로 짧게 작성하세요.
                    """;
            case QUIZ_QUESTIONS -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
                    - 문자열 값에는 줄바꿈을 넣지 마세요(필요하면 \\n 으로 escape).
                    - 문자열 값 안에는 큰따옴표(") 문자를 넣지 마세요(필요하면 괄호나 작은따옴표로 표현).
                    - referenceAnswer는 더 짧게 작성하세요.
                    - rubricKeywords 개수를 줄이세요.
                    """;
            case FEEDBACK -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
                    - 문자열 값에는 줄바꿈을 넣지 마세요(필요하면 \\n 으로 escape).
                    - 문자열 값 안에는 큰따옴표(") 문자를 넣지 마세요(필요하면 괄호나 작은따옴표로 표현).
                    - strengths/improvements는 최대 3개로 제한하세요.
                    - suggestedAnswer는 500자 이내로 짧게 작성하세요.
                    - followups는 최대 2개로 제한하세요.
                    """;
        };
    }

    private static String retryRulesAttempt3(RetryProfile profile) {
        return switch (profile) {
            case QUESTIONS -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
                    - 문자열 값에는 줄바꿈을 넣지 마세요(필요하면 \\n 으로 escape).
                    - 문자열 값 안에는 큰따옴표(") 문자를 넣지 마세요(필요하면 괄호나 작은따옴표로 표현).
                    - 질문은 정확히 3개만 출력하세요.
                    - modelAnswer는 반드시 빈 문자열("")로 출력하세요. (출력 길이 최우선)
                    - intention은 140자 이내로 아주 짧게 작성하세요.
                    - keywords는 90자 이내로 아주 짧게 작성하세요.
                    """;
            case QUIZ_QUESTIONS -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
                    - 문자열 값에는 줄바꿈을 넣지 마세요(필요하면 \\n 으로 escape).
                    - 문자열 값 안에는 큰따옴표(") 문자를 넣지 마세요(필요하면 괄호나 작은따옴표로 표현).
                    - prompt/referenceAnswer를 아주 짧게 작성하세요.
                    - rubricKeywords는 3개 이하로 작성하세요.
                    """;
            case FEEDBACK -> """

                    [RETRY_RULES]
                    - 반드시 유효한 JSON만 출력하세요(중간에 끊기면 안 됩니다).
                    - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
                    - 문자열 값에는 줄바꿈을 넣지 마세요(필요하면 \\n 으로 escape).
                    - 문자열 값 안에는 큰따옴표(") 문자를 넣지 마세요(필요하면 괄호나 작은따옴표로 표현).
                    - strengths/improvements는 최대 2개로 제한하세요.
                    - suggestedAnswer는 250자 이내로 아주 짧게 작성하세요.
                    - followups는 최대 1개로 제한하세요.
                    """;
        };
    }

    private record FeedbackPayload(
            List<String> strengths,
            List<String> improvements,
            String suggestedAnswer,
            List<String> followups
    ) {
    }

    private FeedbackPayload parseFeedbackPayload(JsonNode json) {
        try {
            return objectMapper.treeToValue(json, FeedbackPayload.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Gemini 피드백 응답 파싱에 실패했습니다.", e);
        }
    }

    private JsonNode generateStructuredJson(String systemInstruction, String userPrompt, Map<String, Object> responseSchema, int maxOutputTokensForRequest) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("systemInstruction", systemInstruction(systemInstruction));
        body.put("contents", List.of(content("user", userPrompt)));
        body.put("generationConfig", Map.of(
                "temperature", 0.2,
                "maxOutputTokens", Math.max(256, maxOutputTokensForRequest),
                "responseMimeType", "application/json",
                "responseSchema", responseSchema
        ));

        String endpoint = baseUrl.replaceAll("/+$", "")
                + "/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        HttpResponse<byte[]> resp = postJson(endpoint, body);
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            String msg = new String(resp.body() == null ? new byte[0] : resp.body(), StandardCharsets.UTF_8);
            if (resp.statusCode() == 429) {
                int retryAfter = extractRetryAfterSeconds(msg);
                aiMetrics.recordRateLimit("gemini");
                log.warn("Gemini rate limit: retryAfter={}s", retryAfter);
                throw new UpstreamRateLimitException("Gemini 호출 제한(429). 잠시 후 다시 시도하거나, 문항 수를 줄이거나, 무료티어 쿼터를 확인해 주세요. body=" + truncate(msg, 2000), retryAfter);
            }
            throw new IllegalStateException("Gemini 호출 실패. status=" + resp.statusCode() + " body=" + truncate(msg, 2000));
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(resp.body());
        } catch (IOException e) {
            throw new IllegalStateException("Gemini 응답 JSON 파싱에 실패했습니다.", e);
        }

        // Gemini는 출력이 길면 parts를 여러 조각으로 나눠 응답할 수 있다.
        String finishReason = root.at("/candidates/0/finishReason").asText(null);

        JsonNode partsNode = root.at("/candidates/0/content/parts");
        String raw;
        if (partsNode != null && partsNode.isArray()) {
            StringBuilder sb = new StringBuilder();
            for (JsonNode p : partsNode) {
                JsonNode t = p.get("text");
                if (t != null && !t.isNull()) sb.append(t.asText());
            }
            raw = sb.toString();
        } else {
            JsonNode textNode = root.at("/candidates/0/content/parts/0/text");
            if (textNode.isMissingNode() || textNode.isNull()) {
                throw new IllegalStateException("Gemini 응답에서 JSON 텍스트를 찾지 못했습니다.");
            }
            raw = textNode.asText();
        }

        String normalized = extractJsonObject(raw);
        try {
            return objectMapper.readTree(normalized);
        } catch (IOException e) {
            String reason = (finishReason == null || finishReason.isBlank()) ? "unknown" : finishReason;
            throw new IllegalStateException("Gemini structured JSON 파싱에 실패했습니다. finishReason=" + reason + " raw=" + truncate(raw, 2000), e);
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
                .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                .build();

        try {
            return httpClient.send(req, HttpResponse.BodyHandlers.ofByteArray());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Gemini 요청이 중단되었습니다.", e);
        } catch (IOException e) {
            throw new IllegalStateException("Gemini 요청 전송에 실패했습니다.", e);
        }
    }

    private static Map<String, Object> content(String role, String text) {
        return Map.of(
                "role", role,
                "parts", List.of(Map.of("text", text == null ? "" : text))
        );
    }

    private static Map<String, Object> systemInstruction(String text) {
        return Map.of(
                "parts", List.of(Map.of("text", text == null ? "" : text))
        );
    }

    private static Map<String, Object> questionResponseSchema() {
        Map<String, Object> questionItem = new LinkedHashMap<>();
        questionItem.put("type", "object");
        questionItem.put("properties", Map.of(
                "badge", Map.of("type", "string", "maxLength", 100),
                "likelihood", Map.of("type", "integer"),
                "question", Map.of("type", "string", "maxLength", 400),
                "intention", Map.of("type", "string", "nullable", true, "maxLength", 600),
                "keywords", Map.of("type", "string", "nullable", true, "maxLength", 300),
                "modelAnswer", Map.of("type", "string", "nullable", true, "maxLength", 1200)
        ));
        questionItem.put("required", List.of("badge", "likelihood", "question", "intention", "keywords", "modelAnswer"));

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", Map.of(
                "questions", Map.of(
                        "type", "array",
                        "items", questionItem,
                        "minItems", 1,
                        "maxItems", 8
                )
        ));
        schema.put("required", List.of("questions"));
        return schema;
    }

    private static Map<String, Object> feedbackResponseSchema() {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", Map.of(
                "strengths", Map.of("type", "array", "items", Map.of("type", "string"), "minItems", 0, "maxItems", 10),
                "improvements", Map.of("type", "array", "items", Map.of("type", "string"), "minItems", 0, "maxItems", 10),
                "suggestedAnswer", Map.of("type", "string", "nullable", true),
                "followups", Map.of("type", "array", "items", Map.of("type", "string"), "minItems", 0, "maxItems", 10)
        ));
        schema.put("required", List.of("strengths", "improvements", "suggestedAnswer", "followups"));
        return schema;
    }

    private void requireApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Gemini API key가 설정되지 않았습니다. env 또는 application.yml에 devweb.gemini.api-key를 설정하세요.");
        }
    }

    private static String extractJsonObject(String raw) {
        if (raw == null) return "{}";
        String s = raw.trim();
        if (s.startsWith("{") && s.endsWith("}")) return s;

        int first = s.indexOf('{');
        int last = s.lastIndexOf('}');
        if (first >= 0 && last > first) {
            return s.substring(first, last + 1);
        }
        // Fallback: Gemini가 순수 JSON을 주도록 설정되어 있으므로 원문 반환
        return s;
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        if (s.length() <= max) return s;
        return s.substring(0, max) + "...";
    }

    private static int extractRetryAfterSeconds(String body) {
        if (body == null) return -1;
        // 1) "Please retry in 1.857s."
        java.util.regex.Matcher m1 = java.util.regex.Pattern.compile("retry in\\s+([0-9]+(?:\\.[0-9]+)?)s", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(body);
        if (m1.find()) {
            try {
                double v = Double.parseDouble(m1.group(1));
                return (int) Math.max(1, Math.ceil(v));
            } catch (NumberFormatException ignored) {
            }
        }
        // 2) JSON field: "retryDelay": "1s"
        java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("\"retryDelay\"\\s*:\\s*\"([0-9]+)s\"")
                .matcher(body);
        if (m2.find()) {
            try {
                return Integer.parseInt(m2.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return -1;
    }
}

