package com.devweb.infra.ai.gemini;

import com.devweb.domain.resume.session.port.InterviewAiPort;
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

@Component
public class GeminiInterviewAiAdapter implements InterviewAiPort {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public GeminiInterviewAiAdapter(
            ObjectMapper objectMapper,
            @Value("${devweb.gemini.api-key:}") String apiKey,
            @Value("${devweb.gemini.model:gemini-2.0-flash}") String model,
            @Value("${devweb.gemini.base-url:https://generativelanguage.googleapis.com}") String baseUrl
    ) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
    }

    @Override
    public List<GeneratedQuestion> generateQuestions(String systemInstruction, String resumeText, String portfolioText, String portfolioUrl) {
        requireApiKey();

        String prompt = buildQuestionsPrompt(resumeText, portfolioText, portfolioUrl);
        Map<String, Object> schema = questionResponseSchema();

        JsonNode json = generateStructuredJson(systemInstruction, prompt, schema);
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
    public GeneratedFeedback generateFeedback(String systemInstruction, String question, String intention, String keywords, String modelAnswer, String answerText) {
        requireApiKey();

        String prompt = buildFeedbackPrompt(question, intention, keywords, modelAnswer, answerText);
        Map<String, Object> schema = feedbackResponseSchema();

        JsonNode json = generateStructuredJson(systemInstruction, prompt, schema);
        try {
            return objectMapper.treeToValue(json, GeneratedFeedback.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Gemini 피드백 응답 파싱에 실패했습니다.", e);
        }
    }

    private JsonNode generateStructuredJson(String systemInstruction, String userPrompt, Map<String, Object> responseSchema) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("systemInstruction", content("system", systemInstruction));
        body.put("contents", List.of(content("user", userPrompt)));
        body.put("generationConfig", Map.of(
                "temperature", 0.4,
                "responseMimeType", "application/json",
                "responseSchema", responseSchema
        ));

        String endpoint = baseUrl.replaceAll("/+$", "")
                + "/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        HttpResponse<byte[]> resp = postJson(endpoint, body);
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            String msg = new String(resp.body() == null ? new byte[0] : resp.body(), StandardCharsets.UTF_8);
            throw new IllegalStateException("Gemini 호출 실패. status=" + resp.statusCode() + " body=" + truncate(msg, 2000));
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(resp.body());
        } catch (IOException e) {
            throw new IllegalStateException("Gemini 응답 JSON 파싱에 실패했습니다.", e);
        }

        JsonNode textNode = root.at("/candidates/0/content/parts/0/text");
        if (textNode.isMissingNode() || textNode.isNull()) {
            throw new IllegalStateException("Gemini 응답에서 JSON 텍스트를 찾지 못했습니다.");
        }

        String raw = textNode.asText();
        String normalized = extractJsonObject(raw);
        try {
            return objectMapper.readTree(normalized);
        } catch (IOException e) {
            throw new IllegalStateException("Gemini structured JSON 파싱에 실패했습니다. raw=" + truncate(raw, 2000), e);
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
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                .build();

        try {
            return httpClient.send(req, HttpResponse.BodyHandlers.ofByteArray());
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Gemini 요청 전송에 실패했습니다.", e);
        }
    }

    private static Map<String, Object> content(String role, String text) {
        return Map.of(
                "role", role,
                "parts", List.of(Map.of("text", text == null ? "" : text))
        );
    }

    private static String buildQuestionsPrompt(String resumeText, String portfolioText, String portfolioUrl) {
        return """
                아래 입력을 기반으로 실제 면접에서 나올 법한 질문 8개를 만들어 주세요.
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

                [ResumeText]
                %s

                [PortfolioText]
                %s

                [PortfolioUrl]
                %s
                """.formatted(
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
                "badge", Map.of("type", "string"),
                "likelihood", Map.of("type", "integer"),
                "question", Map.of("type", "string"),
                "intention", Map.of("type", "string", "nullable", true),
                "keywords", Map.of("type", "string", "nullable", true),
                "modelAnswer", Map.of("type", "string", "nullable", true)
        ));
        questionItem.put("required", List.of("badge", "likelihood", "question", "intention", "keywords", "modelAnswer"));

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", Map.of(
                "questions", Map.of(
                        "type", "array",
                        "items", questionItem,
                        "minItems", 1,
                        "maxItems", 12
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
}

