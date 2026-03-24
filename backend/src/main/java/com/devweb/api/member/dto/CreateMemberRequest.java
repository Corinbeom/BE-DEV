package com.devweb.api.member.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "회원 생성 요청")
public record CreateMemberRequest(
        @Schema(description = "이메일 주소", example = "user@example.com")
        @Email @NotBlank String email
) {
}
