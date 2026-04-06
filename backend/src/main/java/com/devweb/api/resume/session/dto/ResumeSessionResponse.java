package com.devweb.api.resume.session.dto;

import com.devweb.domain.resume.session.model.ResumeSession;
import com.devweb.domain.resume.session.model.ResumeSessionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Schema(description = "이력서 분석 세션 응답")
public record ResumeSessionResponse(
        @Schema(description = "세션 ID", example = "1")
        Long id,
        @Schema(description = "세션 제목", example = "백엔드 면접 준비")
        String title,
        @Schema(description = "지원 직무 유형", example = "BACKEND")
        String positionType,
        @Schema(description = "포트폴리오 URL", example = "https://github.com/user/portfolio")
        String portfolioUrl,
        @Schema(description = "세션 상태", example = "COMPLETED")
        ResumeSessionStatus status,
        @Schema(description = "면접 질문 목록")
        List<ResumeQuestionResponse> questions,
        @Schema(description = "생성 일시")
        LocalDateTime createdAt,
        @Schema(description = "수정 일시")
        LocalDateTime updatedAt
) implements Serializable {
    public static ResumeSessionResponse from(ResumeSession s) {
        return new ResumeSessionResponse(
                s.getId(),
                s.getTitle(),
                s.getPositionType(),
                s.getPortfolioUrl(),
                s.getStatus(),
                new ArrayList<>(s.getQuestions().stream().map(ResumeQuestionResponse::from).toList()),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
