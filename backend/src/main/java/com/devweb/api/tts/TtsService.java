package com.devweb.api.tts;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
public class TtsService {

    private static final Logger log = LoggerFactory.getLogger(TtsService.class);
    private static final String BASE_URL = "https://supertoneapi.com";

    @Value("${devweb.supertone.api-key}")
    private String apiKey;

    @Value("${devweb.supertone.voice-id}")
    private String voiceId;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public byte[] generateSpeech(String text) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "text", text,
                    "language", "ko",
                    "style", "neutral",
                    "model", "sona_speech_1"
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/v1/text-to-speech/" + voiceId))
                    .header("Content-Type", "application/json")
                    .header("x-sup-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(
                    request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() != 200) {
                log.error("Supertone API 오류: status={} body={}",
                        response.statusCode(), new String(response.body()));
                throw new RuntimeException("Supertone TTS 실패: " + response.statusCode());
            }

            return response.body();

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("TTS 생성 중 오류 발생", e);
        }
    }
}
