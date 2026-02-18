package com.devweb.api.recruitmenttracker.entry.dto;

import com.devweb.domain.recruitmenttracker.entry.model.PlatformType;
import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentEntry;
import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentStep;

public record RecruitmentEntryResponse(
        Long id,
        Long memberId,
        String companyName,
        String position,
        RecruitmentStep step,
        PlatformType platformType,
        String externalId
) {
    public static RecruitmentEntryResponse from(RecruitmentEntry entry) {
        return new RecruitmentEntryResponse(
                entry.getId(),
                entry.getMember().getId(),
                entry.getCompanyName(),
                entry.getPosition(),
                entry.getStep(),
                entry.getPlatformType(),
                entry.getExternalId()
        );
    }
}


