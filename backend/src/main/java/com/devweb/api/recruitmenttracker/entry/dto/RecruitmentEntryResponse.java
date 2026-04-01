package com.devweb.api.recruitmenttracker.entry.dto;

import com.devweb.domain.recruitmenttracker.entry.model.PlatformType;
import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentEntry;
import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentStep;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

@Schema(description = "채용 지원 항목 응답")
public record RecruitmentEntryResponse(
        @Schema(description = "항목 ID", example = "1")
        Long id,
        @Schema(description = "회원 ID", example = "1")
        Long memberId,
        @Schema(description = "회사명", example = "네이버")
        String companyName,
        @Schema(description = "지원 포지션", example = "백엔드 엔지니어")
        String position,
        @Schema(description = "채용 단계", example = "APPLIED")
        RecruitmentStep step,
        @Schema(description = "지원 플랫폼", example = "WANTED")
        PlatformType platformType,
        @Schema(description = "외부 플랫폼 지원 ID", example = "ext-12345")
        String externalId,
        @Schema(description = "지원일", example = "2025-01-15")
        LocalDate appliedDate
) {
    public static RecruitmentEntryResponse from(RecruitmentEntry entry) {
        return new RecruitmentEntryResponse(
                entry.getId(),
                entry.getMember().getId(),
                entry.getCompanyName(),
                entry.getPosition(),
                entry.getStep(),
                entry.getPlatformType(),
                entry.getExternalId(),
                entry.getAppliedDate()
        );
    }
}
