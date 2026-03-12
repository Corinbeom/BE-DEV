package com.devweb.api.resume.session.dto;

public record CreateResumeSessionRequest(
        String positionType,
        Long resumeId,
        Long portfolioResumeId,
        String portfolioUrl,
        String title
) {
}
