package com.devweb.api.studyquiz.session.dto;

import java.io.Serializable;
import java.util.List;

public record CsQuizStatsResponse(
        int totalAttempts,
        int correctCount,
        double overallAccuracy,
        List<TopicAccuracy> topicAccuracies
) implements Serializable {
    public record TopicAccuracy(
            String topic,
            int totalAttempts,
            int correctCount,
            double accuracy
    ) implements Serializable {}
}
