package com.devweb.api.tts;

import com.devweb.api.tts.dto.TtsSpeakRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tts")
public class TtsController {

    private final TtsService ttsService;

    public TtsController(TtsService ttsService) {
        this.ttsService = ttsService;
    }

    @PostMapping(value = "/speak", produces = "audio/wav")
    public ResponseEntity<byte[]> speak(@Valid @RequestBody TtsSpeakRequest req) {
        byte[] audio = ttsService.generateSpeech(req.text());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/wav"))
                .body(audio);
    }
}
