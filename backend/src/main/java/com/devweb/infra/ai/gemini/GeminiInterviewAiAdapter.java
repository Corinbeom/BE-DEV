package com.devweb.infra.ai.gemini;

import com.devweb.domain.resume.session.port.InterviewAiPort;
import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import com.devweb.domain.studyquiz.session.port.CsQuizAiPort;
import com.devweb.common.UpstreamRateLimitException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
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
public class GeminiInterviewAiAdapter implements InterviewAiPort, CsQuizAiPort {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final int requestTimeoutSeconds;
    private final int maxOutputTokens;

    private static final int QUESTIONS_TARGET = 5;

    public GeminiInterviewAiAdapter(
            ObjectMapper objectMapper,
            @Value("${devweb.gemini.api-key:}") String apiKey,
            @Value("${devweb.gemini.model:gemini-2.5-flash}") String model,
            @Value("${devweb.gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl,
            @Value("${devweb.gemini.request-timeout-seconds:90}") int requestTimeoutSeconds,
            @Value("${devweb.gemini.max-output-tokens:8192}") int maxOutputTokens
    ) {
        this.objectMapper = objectMapper;
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
    public List<GeneratedQuestion> generateQuestions(String systemInstruction, String resumeText, String portfolioText, String portfolioUrl) {
        requireApiKey();

        String prompt = buildQuestionsPrompt(resumeText, portfolioText, portfolioUrl);
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

        String prompt = buildFeedbackPrompt(question, intention, keywords, modelAnswer, answerText);
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
            String prompt = buildCsQuizQuestionsPrompt(topics, difficulty, type, batch);
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

    private static String buildCsQuizQuestionsPrompt(Set<CsQuizTopic> topics, CsQuizDifficulty difficulty, CsQuizQuestionType type, int count) {
        String topicsCsv = topics.stream().map(Enum::name).sorted().reduce((a, b) -> a + ", " + b).orElse("");
        return """
                아래 조건을 만족하는 CS 퀴즈 문제를 정확히 %d개 생성하세요.
                난이도는 모두 %s, 토픽은 다음 목록 중에서만 선택하세요: %s
                문제 유형은 모두 %s 입니다.

                출력은 반드시 JSON으로만, 아래 스키마를 지키세요:
                {
                  "questions": [
                    {
                      "topic": "OS|NETWORK|DB|SPRING|JAVA|DATA_STRUCTURE|ALGORITHM|ARCHITECTURE|CLOUD",
                      "difficulty": "LOW|MID|HIGH",
                      "type": "MULTIPLE_CHOICE|SHORT_ANSWER",
                      "prompt": "문제 본문",
                      "choices": ["보기1", "보기2", "보기3", "보기4"],
                      "correctChoiceIndex": 0,
                      "referenceAnswer": "정답/해설(짧게)",
                      "rubricKeywords": ["키워드1","키워드2"]
                    }
                  ]
                }

                규칙:
                - JSON은 한 줄(minified)로만 출력하세요. 설명 텍스트 금지.
                - 문자열 값에 줄바꿈 금지(필요하면 \\n).
                - 문자열 값 안에 큰따옴표(") 넣지 마세요.
                - topic/difficulty/type은 반드시 조건과 일치해야 합니다.
                - prompt는 220자 이내로 작성하세요.
                - MULTIPLE_CHOICE:
                  - choices는 반드시 4개
                  - correctChoiceIndex는 0~3
                  - referenceAnswer는 350자 이내
                  - rubricKeywords는 빈 배열로
                - SHORT_ANSWER:
                  - choices는 빈 배열
                  - correctChoiceIndex는 -1
                  - referenceAnswer는 550자 이내
                  - rubricKeywords는 3~6개
                """.formatted(count, difficulty.name(), topicsCsv, type.name());
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
        String prompt = buildCsMultipleChoiceFeedbackPrompt(topic, difficulty, question, choices, correctChoiceIndex, selectedChoiceIndex);
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
        String prompt = buildCsShortAnswerFeedbackPrompt(topic, difficulty, question, referenceAnswer, rubricKeywords, userAnswer);
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
                return generateStructuredJson(systemInstruction, prompt, responseSchema, tokens);
            } catch (IllegalStateException e) {
                String msg = e.getMessage() == null ? "" : e.getMessage();
                boolean isJsonFailure = msg.contains("structured JSON 파싱에 실패") || msg.contains("JSON 텍스트를 찾지 못했습니다");
                if (!isJsonFailure) throw e;
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

    private static String buildCsMultipleChoiceFeedbackPrompt(
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            String question,
            List<String> choices,
            int correctChoiceIndex,
            int selectedChoiceIndex
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
                다음 객관식 문제에 대해, 사용자의 선택이 왜 맞/틀렸는지 설명하고 피드백을 제공하세요.
                출력은 반드시 JSON으로만, 아래 필드를 포함하세요:
                - strengths: 잘한 점(0~3개)
                - improvements: 개선할 점(0~3개)
                - suggestedAnswer: 정답/해설(한 단락, 500자 이내)
                - followups: 추가 꼬리질문(0~2개)

                제약:
                - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
                - 모든 문자열 값에는 줄바꿈 금지(필요하면 \\n).
                - 문자열 값 안에는 큰따옴표(")를 넣지 마세요.

                [Topic] %s
                [Difficulty] %s
                [Question] %s
                [Choices]
                """.formatted(topic.name(), difficulty.name(), nullToEmpty(question)));
        for (int i = 0; i < choices.size(); i++) {
            sb.append(i).append(". ").append(choices.get(i)).append("\n");
        }
        sb.append("[CorrectChoiceIndex] ").append(correctChoiceIndex).append("\n");
        sb.append("[SelectedChoiceIndex] ").append(selectedChoiceIndex).append("\n");
        return sb.toString();
    }

    private static String buildCsShortAnswerFeedbackPrompt(
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            String question,
            String referenceAnswer,
            List<String> rubricKeywords,
            String userAnswer
    ) {
        String keywords = (rubricKeywords == null || rubricKeywords.isEmpty()) ? "" : String.join(", ", rubricKeywords);
        return """
                다음 주관식 문제에 대해 사용자의 답변을 정성 평가하고 피드백을 제공하세요.
                출력은 반드시 JSON으로만, 아래 필드를 포함하세요:
                - strengths: 잘한 점(0~5개)
                - improvements: 개선할 점(0~5개)
                - suggestedAnswer: 개선 예시 답변(한 단락, 700자 이내)
                - followups: 추가 꼬리질문(0~3개)

                제약:
                - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
                - 모든 문자열 값에는 줄바꿈 금지(필요하면 \\n).
                - 문자열 값 안에는 큰따옴표(")를 넣지 마세요.
                - 추측/날조 금지. 모르면 '부족'으로 판단하고 어떤 포인트가 필요한지 제시하세요.

                [Topic] %s
                [Difficulty] %s
                [Question] %s
                [RubricKeywords] %s
                [ReferenceAnswer] %s
                [UserAnswer] %s
                """.formatted(
                topic.name(),
                difficulty.name(),
                nullToEmpty(question),
                nullToEmpty(keywords),
                nullToEmpty(referenceAnswer),
                nullToEmpty(userAnswer)
        );
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

    private static String buildQuestionsPrompt(String resumeText, String portfolioText, String portfolioUrl) {
        return """
                아래 입력을 기반으로 실제 면접에서 나올 법한 질문 %d개를 만들어 주세요.
                각 질문은 반드시 다음 필드를 포함해야 합니다:
                - badge: 질문 분류(예: 프로젝트 기반, 기술적 난관, 협업/행동, 기술 스택, 아키텍처, 성능/최적화, 운영/장애대응)
                - likelihood: 출제 확률(0~100)
                - question: 질문 본문
                - intention: 출제 의도(한두 문장)
                - keywords: 핵심 키워드(쉼표 구분)
                - modelAnswer: 모범 답안(3~7문장)

                제약:
                - 과장/추측 금지. 제공된 텍스트에서만 근거를 잡아주세요.
                - 질문은 가능한 한 구체적으로(프로젝트/기술/의사결정/성과 검증).
                - 반드시 JSON으로만 응답하세요(스키마 준수).
                - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
                - 모든 문자열 값에는 줄바꿈을 넣지 마세요(필요하면 \\n 으로 escape).
                - 모든 문자열 값 안에는 큰따옴표(") 문자를 넣지 마세요(필요하면 괄호나 작은따옴표로 표현).
                - 길이 제한을 지켜주세요:
                  - question: 250자 이내
                  - intention: 350자 이내
                  - keywords: 200자 이내
                  - modelAnswer: 500자 이내(단락 1개)

                [ResumeText]
                %s

                [PortfolioText]
                %s

                [PortfolioUrl]
                %s
                """.formatted(
                QUESTIONS_TARGET,
                nullToEmpty(resumeText),
                nullToEmpty(portfolioText),
                nullToEmpty(portfolioUrl)
        );
    }

    private static String buildFeedbackPrompt(String question, String intention, String keywords, String modelAnswer, String answerText) {
        return """
                다음 질문과 사용자 답변을 평가해 주세요.
                출력은 반드시 JSON으로만, 아래 필드를 포함하세요:
                - strengths: 잘한 점(2~5개)
                - improvements: 개선할 점(2~5개)
                - suggestedAnswer: 개선 예시 답변(한 단락)
                - followups: 추가 꼬리질문(1~3개)

                기준:
                - 정확성/구체성/근거/깊이/커뮤니케이션을 종합적으로 봅니다.
                - 답변이 모호하면 어떤 정보를 추가해야 하는지 구체적으로 제시합니다.
                - 모든 문자열 값에는 줄바꿈을 넣지 마세요(필요하면 \\n 으로 escape).
                - suggestedAnswer는 900자 이내로 작성하세요.

                [Question]
                %s

                [Intention]
                %s

                [Keywords]
                %s

                [ModelAnswer]
                %s

                [UserAnswer]
                %s
                """.formatted(
                nullToEmpty(question),
                nullToEmpty(intention),
                nullToEmpty(keywords),
                nullToEmpty(modelAnswer),
                nullToEmpty(answerText)
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

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
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

