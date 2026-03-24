package com.devweb.api.studyquiz.session.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.io.Serializable;
import java.util.List;

@Schema(description = "CS 퀴즈 통계 응답")
public record CsQuizStatsResponse(
        @Schema(description = "총 풀이 횟수", example = "50")
        int totalAttempts,
        @Schema(description = "정답 수", example = "35")
        int correctCount,
        @Schema(description = "전체 정답률 (%)", example = "70.0")
        double overallAccuracy,
        @Schema(description = "토픽별 정답률")
        List<TopicAccuracy> topicAccuracies
) implements Serializable {
    @Schema(description = "토픽별 정답률 상세")
    public record TopicAccuracy(
            @Schema(description = "토픽명", example = "NETWORK")
            String topic,
            @Schema(description = "풀이 횟수", example = "10")
            int totalAttempts,
            @Schema(description = "정답 수", example = "7")
            int correctCount,
            @Schema(description = "정답률 (%)", example = "70.0")
            double accuracy
    ) implements Serializable {}
}
