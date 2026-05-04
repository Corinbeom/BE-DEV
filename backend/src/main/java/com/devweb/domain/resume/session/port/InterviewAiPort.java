package com.devweb.domain.resume.session.port;

import java.util.List;

public interface InterviewAiPort {

    record GeneratedQuestion(String badge, int likelihood, String question, String intention, String keywords, String modelAnswer) {
    }

    record GeneratedFeedback(
            List<String> strengths,
            List<String> improvements,
            String suggestedAnswer,
            List<String> followups,
            List<String> deliveryStrengths,
            List<String> deliveryImprovements
    ) {
        /** 행동 분석 없는 기존 호환 생성자 */
        public GeneratedFeedback(List<String> strengths, List<String> improvements, String suggestedAnswer, List<String> followups) {
            this(strengths, improvements, suggestedAnswer, followups, null, null);
        }
    }

    List<GeneratedQuestion> generateQuestions(String systemInstruction, String positionType, String resumeText, String portfolioText, String portfolioUrl, List<String> targetTechnologies);

    default List<GeneratedQuestion> generateQuestionsWithHistory(String systemInstruction, String positionType, String resumeText, String portfolioText, String portfolioUrl, List<String> targetTechnologies, List<String> previousQuestions) {
        return generateQuestions(systemInstruction, positionType, resumeText, portfolioText, portfolioUrl, targetTechnologies);
    }

    GeneratedFeedback generateFeedback(String systemInstruction, String question, String intention, String keywords, String modelAnswer, String answerText);

    /** 행동 분석 지표 포함 오버로드 — null 전달 시 기존 동작과 동일 */
    record BehavioralMetrics(Double eyeContactRatio, Double postureStability, Double expressionVariety, Double fidgetingScore) {}

    default GeneratedFeedback generateFeedbackWithBehavior(String systemInstruction, String question, String intention,
                                                            String keywords, String modelAnswer, String answerText,
                                                            BehavioralMetrics behavioralMetrics) {
        return generateFeedback(systemInstruction, question, intention, keywords, modelAnswer, answerText);
    }

    record BadgeSummary(String badge, String summary, List<String> strengths, List<String> weaknesses) {}
    record Improvement(String title, String description) {}
    record GeneratedSessionReport(
            String executiveSummary,
            List<BadgeSummary> badgeSummaries,
            List<String> repeatedGaps,
            List<Improvement> topImprovements,
            int overallScore,
            String closingAdvice
    ) {}

    GeneratedSessionReport generateSessionReport(String systemInstruction, String sessionData);

    record LearningPlanItem(int priority, String area, String action, String reason) {}
    record GeneratedCoachingReport(
            String overallAssessment,
            String growthTrajectory,
            List<String> persistentStrengths,
            List<String> persistentWeaknesses,
            List<LearningPlanItem> learningPlan,
            int readinessScore,
            String nextSteps
    ) {}

    GeneratedCoachingReport generateCoachingReport(String systemInstruction, String coachingData);

    record MatchedKeyword(String keyword, String category) {}
    record MissingKeyword(String keyword, String importance, String suggestion) {}
    record GeneratedJdMatchAnalysis(
            int matchRate,
            List<MatchedKeyword> matchedKeywords,
            List<MissingKeyword> missingKeywords,
            String summary,
            List<String> recommendations
    ) {}

    GeneratedJdMatchAnalysis analyzeJdMatch(String systemInstruction, String resumeText, String portfolioText, String jdText);

    record ChatMessage(String role, String content) {}

    record GeneratedInterviewerTurn(
            String message,
            String badge,
            boolean isComplete,
            String intention,
            String keywords
    ) {}

    default GeneratedInterviewerTurn conductInterview(
            String systemInstruction,
            String resumeContext,
            String positionType,
            List<ChatMessage> history,
            int turnCount,
            int maxTurns
    ) {
        throw new UnsupportedOperationException("conductInterview가 구현되지 않았습니다.");
    }
}

