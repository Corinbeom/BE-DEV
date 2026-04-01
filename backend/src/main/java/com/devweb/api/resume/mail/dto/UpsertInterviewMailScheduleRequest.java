package com.devweb.api.resume.mail.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@Schema(description = "면접 질문 자동 메일 스케줄 생성/수정 요청")
public record UpsertInterviewMailScheduleRequest(

        @Schema(description = "이력서 ID", example = "1")
        @NotNull(message = "resumeId는 필수입니다.")
        Long resumeId,

        @Schema(description = "직무 유형", example = "BE")
        @NotNull(message = "positionType은 필수입니다.")
        String positionType,

        @Schema(description = "발송 시간 (KST, 0~23)", example = "9")
        @NotNull(message = "sendHour는 필수입니다.")
        @Min(value = 0, message = "sendHour는 0 이상이어야 합니다.")
        @Max(value = 23, message = "sendHour는 23 이하이어야 합니다.")
        Integer sendHour,

        @Schema(description = "활성화 여부", example = "true")
        @NotNull(message = "enabled는 필수입니다.")
        Boolean enabled,

        @Schema(description = "기술 스택 목록", example = "[\"Spring\", \"JPA\"]")
        List<String> targetTechnologies
) {
}
