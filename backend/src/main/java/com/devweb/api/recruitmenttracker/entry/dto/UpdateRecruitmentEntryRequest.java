package com.devweb.api.recruitmenttracker.entry.dto;

import com.devweb.domain.recruitmenttracker.entry.model.PlatformType;
import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentStep;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record UpdateRecruitmentEntryRequest(
        @NotBlank String companyName,
        @NotBlank String position,
        RecruitmentStep step,
        PlatformType platformType,
        String externalId,
        LocalDate appliedDate
) {
}


