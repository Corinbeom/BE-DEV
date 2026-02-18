package com.devweb.api.recruitmenttracker.entry.dto;

import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentStep;
import jakarta.validation.constraints.NotNull;

public record UpdateRecruitmentStepRequest(
        @NotNull RecruitmentStep step
) {
}


