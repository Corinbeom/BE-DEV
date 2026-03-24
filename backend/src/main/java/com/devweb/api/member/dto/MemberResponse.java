package com.devweb.api.member.dto;

import com.devweb.domain.member.model.Member;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "회원 정보 응답")
public record MemberResponse(
        @Schema(description = "회원 ID", example = "1")
        Long id,
        @Schema(description = "이메일", example = "user@example.com")
        String email,
        @Schema(description = "표시 이름", example = "홍길동")
        String displayName,
        @Schema(description = "프로필 사진 URL", example = "https://lh3.googleusercontent.com/a/photo")
        String photoUrl
) {
    public static MemberResponse from(Member member) {
        return new MemberResponse(
                member.getId(),
                member.getEmail(),
                member.getDisplayName(),
                member.getPhotoUrl()
        );
    }
}
