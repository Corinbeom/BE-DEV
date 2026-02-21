package com.devweb.domain.resume.session.port;

import java.util.List;

public interface InterviewAiPort {

    record GeneratedQuestion(String badge, int likelihood, String question, String intention, String keywords, String modelAnswer) {
    }

    record GeneratedFeedback(List<String> strengths, List<String> improvements, String suggestedAnswer, List<String> followups) {
    }

    List<GeneratedQuestion> generateQuestions(String systemInstruction, String resumeText, String portfolioText, String portfolioUrl);

    GeneratedFeedback generateFeedback(String systemInstruction, String question, String intention, String keywords, String modelAnswer, String answerText);
}

