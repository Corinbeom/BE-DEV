package com.devweb.infra.mail;

import com.devweb.domain.resume.mail.port.EmailSenderPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

@Component
public class ResendEmailAdapter implements EmailSenderPort {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailAdapter.class);
    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String from;

    public ResendEmailAdapter(
            ObjectMapper objectMapper,
            @Value("${devweb.resend.api-key:}") String apiKey,
            @Value("${devweb.resend.from:onboarding@resend.dev}") String from
    ) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        this.apiKey = apiKey;
        this.from = from;
    }

    @PostConstruct
    public void logConfig() {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("=== [ResendEmailAdapter] RESEND_API_KEY 미설정 — 이메일 발송 비활성화 ===");
        } else {
            log.info("[ResendEmailAdapter] 활성화. from={}", from);
        }
    }

    @Override
    public void send(String to, String subject, String htmlBody) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Resend API key가 설정되지 않아 이메일을 발송하지 않습니다. to={}, subject={}", to, subject);
            return;
        }

        Map<String, String> body = Map.of(
                "from", from,
                "to", to,
                "subject", subject,
                "html", htmlBody
        );

        String json;
        try {
            json = objectMapper.writeValueAsString(body);
        } catch (IOException e) {
            throw new IllegalStateException("이메일 요청 JSON 직렬화에 실패했습니다.", e);
        }

        HttpRequest request = HttpRequest.newBuilder(URI.create(RESEND_API_URL))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("이메일 발송이 중단되었습니다.", e);
        } catch (IOException e) {
            throw new IllegalStateException("이메일 발송에 실패했습니다.", e);
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            log.error("Resend API 호출 실패: status={}, body={}", response.statusCode(), response.body());
            throw new IllegalStateException("이메일 발송에 실패했습니다. status=" + response.statusCode());
        }

        log.info("이메일 발송 완료: to={}, subject={}", to, subject);
    }
}
