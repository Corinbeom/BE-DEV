package com.devweb.domain.resume.session.port;

import java.util.List;

public interface InterviewAiPort {

    record GeneratedQuestion(String badge, int likelihood, String question, String intention, String keywords, String modelAnswer) {
    }

    record GeneratedFeedback(List<String> strengths, List<String> improvements, String suggestedAnswer, List<String> followups) {
    }

    List<GeneratedQuestion> generateQuestions(String systemInstruction, String resumeText, String portfolioText, String portfolioUrl, List<String> targetTechnologies);

    default List<GeneratedQuestion> generateQuestionsWithHistory(String systemInstruction, String resumeText, String portfolioText, String portfolioUrl, List<String> targetTechnologies, List<String> previousQuestions) {
        return generateQuestions(systemInstruction, resumeText, portfolioText, portfolioUrl, targetTechnologies);
    }

    GeneratedFeedback generateFeedback(String systemInstruction, String question, String intention, String keywords, String modelAnswer, String answerText);

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
}

