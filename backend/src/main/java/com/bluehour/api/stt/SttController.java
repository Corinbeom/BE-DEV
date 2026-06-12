package com.bluehour.api.stt;

import com.bluehour.common.ApiResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Hidden;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Groq Whisper STT 프록시 컨트롤러.
 * 브라우저 MediaRecorder가 캡처한 오디오를 받아 Groq Whisper API로 전달하고
 * 전사 텍스트를 반환한다. API 키는 서버에서만 관리한다.
 */
@Hidden
@RestController
@RequestMapping("/api/stt")
public class SttController {

    private static final Logger log = LoggerFactory.getLogger(SttController.class);
    private static final String WHISPER_MODEL = "whisper-large-v3-turbo";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String baseUrl;

    public SttController(
            ObjectMapper objectMapper,
            @Value("${bluehour.groq.api-key:}") String apiKey,
            @Value("${bluehour.groq.base-url:https://api.groq.com}") String baseUrl
    ) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> transcribe(@RequestParam("audio") MultipartFile audio) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Groq API key 미설정 — STT 건너뜀");
            return ApiResponse.success(Map.of("text", ""));
        }
        try {
            String text = callWhisper(audio);
            return ApiResponse.success(Map.of("text", text));
        } catch (Exception e) {
            log.error("Whisper STT 호출 실패: {}", e.getMessage());
            return ApiResponse.success(Map.of("text", ""));
        }
    }

    private String callWhisper(MultipartFile audio) throws IOException, InterruptedException {
        String boundary = "----FormBoundary" + UUID.randomUUID().toString().replace("-", "");
        String endpoint = baseUrl.replaceAll("/+$", "") + "/openai/v1/audio/transcriptions";

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        // file part
        String fileHeader = "--" + boundary + "\r\n" +
                "Content-Disposition: form-data; name=\"file\"; filename=\"audio.webm\"\r\n" +
                "Content-Type: " + resolveContentType(audio) + "\r\n\r\n";
        baos.write(fileHeader.getBytes(StandardCharsets.UTF_8));
        baos.write(audio.getBytes());
        baos.write("\r\n".getBytes(StandardCharsets.UTF_8));
        // text fields
        writeField(baos, boundary, "model", WHISPER_MODEL);
        writeField(baos, boundary, "language", "ko");
        writeField(baos, boundary, "response_format", "json");
        // closing boundary
        baos.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint))
                .timeout(Duration.ofSeconds(30))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(baos.toByteArray()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            log.warn("Whisper 응답 오류: status={} body={}", response.statusCode(),
                    truncate(response.body(), 500));
            return "";
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode textNode = root.get("text");
        return (textNode == null || textNode.isNull()) ? "" : textNode.asText();
    }

    private static void writeField(ByteArrayOutputStream baos, String boundary, String name, String value)
            throws IOException {
        String part = "--" + boundary + "\r\n" +
                "Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n" +
                value + "\r\n";
        baos.write(part.getBytes(StandardCharsets.UTF_8));
    }

    private static String resolveContentType(MultipartFile audio) {
        String ct = audio.getContentType();
        return (ct != null && !ct.isBlank()) ? ct : "audio/webm";
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }
}
