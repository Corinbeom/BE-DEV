package com.devweb.api.studyquiz.session.dto;

import com.devweb.domain.studyquiz.session.model.CsQuizSession;
import com.devweb.domain.studyquiz.session.model.CsQuizSessionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Schema(description = "CS 퀴즈 세션 응답")
public record CsQuizSessionResponse(
        @Schema(description = "세션 ID", example = "1")
        Long id,
        @Schema(description = "세션 제목", example = "네트워크 기초 퀴즈")
        String title,
        @Schema(description = "난이도", example = "MEDIUM")
        String difficulty,
        @Schema(description = "출제 토픽 목록")
        Set<String> topics,
        @Schema(description = "세션 상태", example = "IN_PROGRESS")
        CsQuizSessionStatus status,
        @Schema(description = "퀴즈 문제 목록")
        List<CsQuizQuestionResponse> questions,
        @Schema(description = "생성 일시")
        LocalDateTime createdAt,
        @Schema(description = "수정 일시")
        LocalDateTime updatedAt
) implements Serializable {
    public static CsQuizSessionResponse from(CsQuizSession s) {
        return new CsQuizSessionResponse(
                s.getId(),
                s.getTitle(),
                s.getDifficulty().name(),
                new LinkedHashSet<>(s.getTopics().stream().map(Enum::name).toList()),
                s.getStatus(),
                new ArrayList<>(s.getQuestions().stream().map(CsQuizQuestionResponse::from).toList()),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }
}
