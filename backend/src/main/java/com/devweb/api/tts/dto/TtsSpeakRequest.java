package com.devweb.api.tts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TtsSpeakRequest(
        @NotBlank @Size(max = 300) String text
) {}
