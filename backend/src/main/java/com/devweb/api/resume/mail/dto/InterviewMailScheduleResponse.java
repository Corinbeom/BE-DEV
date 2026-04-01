package com.devweb.api.resume.mail.dto;

import com.devweb.domain.resume.mail.model.InterviewMailSchedule;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

@Schema(description = "면접 질문 자동 메일 스케줄 응답")
public record InterviewMailScheduleResponse(
        @Schema(description = "스케줄 ID") Long id,
        @Schema(description = "이력서 ID") Long resumeId,
        @Schema(description = "이력서 제목") String resumeTitle,
        @Schema(description = "직무 유형") String positionType,
        @Schema(description = "발송 시간 (KST, 0~23)") int sendHour,
        @Schema(description = "활성화 여부") boolean enabled,
        @Schema(description = "기술 스택 목록") List<String> targetTechnologies,
        @Schema(description = "생성일시") LocalDateTime createdAt,
        @Schema(description = "수정일시") LocalDateTime updatedAt
) {
    public static InterviewMailScheduleResponse from(InterviewMailSchedule schedule) {
        return new InterviewMailScheduleResponse(
                schedule.getId(),
                schedule.getResume().getId(),
                schedule.getResume().getTitle(),
                schedule.getPositionType().name(),
                schedule.getSendHour(),
                schedule.isEnabled(),
                schedule.getTargetTechnologies(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt()
        );
    }
}
