package com.devweb.api.studyquiz.session.dto;

import java.util.List;

public record CsQuizStatsResponse(
        int totalAttempts,
        int correctCount,
        double overallAccuracy,
        List<TopicAccuracy> topicAccuracies
) {
    public record TopicAccuracy(
            String topic,
            int totalAttempts,
            int correctCount,
            double accuracy
    ) {}
}
