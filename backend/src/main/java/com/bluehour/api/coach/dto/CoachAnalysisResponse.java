package com.bluehour.api.coach.dto;

import com.bluehour.domain.coach.port.CoachAiPort;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.util.List;

public record CoachAnalysisResponse(
        int score,
        String primary,
        List<String> strengths,
        List<String> gaps,
        List<PlanItem> plan,
        String today,
        boolean needsTargetRoles
) implements Serializable {

    public static CoachAnalysisResponse from(CoachAiPort.GeneratedCoachAnalysis analysis) {
        return new CoachAnalysisResponse(
                clampScore(analysis.score()),
                nullToBlank(analysis.primary()),
                limit(analysis.strengths(), 2),
                limit(analysis.gaps(), 2),
                limit(analysis.plan(), 3).stream()
                        .map(item -> new PlanItem(item.d(), nullToBlank(item.do_())))
                        .toList(),
                nullToBlank(analysis.today()),
                false
        );
    }

    public static CoachAnalysisResponse forMissingTargetRoles() {
        return new CoachAnalysisResponse(
                0,
                "",
                List.of(),
                List.of(),
                List.of(),
                "관심 직무를 설정하면 맞춤 코칭을 시작할 수 있습니다.",
                true
        );
    }

    private static int clampScore(int score) {
        return Math.max(0, Math.min(100, score));
    }

    private static String nullToBlank(String value) {
        return value == null ? "" : value;
    }

    private static <T> List<T> limit(List<T> values, int max) {
        if (values == null || values.isEmpty()) return List.of();
        return values.stream().limit(max).toList();
    }

    public record PlanItem(
            int d,
            @JsonProperty("do")
            String do_
    ) implements Serializable {}
}
