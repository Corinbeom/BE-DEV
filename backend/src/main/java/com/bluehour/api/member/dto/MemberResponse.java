package com.bluehour.api.member.dto;

import com.bluehour.domain.member.model.Member;
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
        String photoUrl,
        @Schema(description = "온보딩 완료 여부", example = "true")
        boolean onboardingCompleted,
        @Schema(description = "관심 직무 목록", example = "[\"백엔드 개발자\"]")
        java.util.List<String> targetRoles
) {
    public static MemberResponse from(Member member) {
        return new MemberResponse(
                member.getId(),
                member.getEmail(),
                member.getDisplayName(),
                member.getPhotoUrl(),
                member.isOnboardingCompleted(),
                member.getTargetRoles()
        );
    }
}
