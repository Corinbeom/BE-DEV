package com.bluehour.api.recruitmenttracker.entry.dto;

import com.bluehour.domain.recruitmenttracker.entry.model.RecruitmentStep;
import jakarta.validation.constraints.NotNull;

public record UpdateRecruitmentStepRequest(
        @NotNull RecruitmentStep step
) {
}


