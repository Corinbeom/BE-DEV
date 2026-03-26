package com.devweb.api.recruitmenttracker.entry.dto;

import com.devweb.domain.recruitmenttracker.entry.model.PlatformType;
import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentStep;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;

@Schema(description = "채용 지원 항목 생성 요청")
public record CreateRecruitmentEntryRequest(
        @Schema(description = "회사명", example = "네이버")
        @NotBlank String companyName,
        @Schema(description = "지원 포지션", example = "백엔드 엔지니어")
        @NotBlank String position,
        @Schema(description = "채용 단계", example = "APPLIED")
        RecruitmentStep step,
        @Schema(description = "지원 플랫폼", example = "WANTED")
        PlatformType platformType,
        @Schema(description = "외부 플랫폼 지원 ID", example = "ext-12345")
        String externalId,
        @Schema(description = "지원일", example = "2025-01-15")
        @PastOrPresent(message = "지원일은 오늘 이후의 날짜를 선택할 수 없습니다.")
        LocalDate appliedDate
) {
}
