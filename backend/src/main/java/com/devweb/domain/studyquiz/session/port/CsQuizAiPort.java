package com.devweb.domain.studyquiz.session.port;

import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;

import java.util.List;
import java.util.Set;

public interface CsQuizAiPort {

    record GeneratedQuizQuestion(
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            CsQuizQuestionType type,
            String prompt,
            List<String> choices,
            Integer correctChoiceIndex,
            String referenceAnswer,
            List<String> rubricKeywords
    ) {
    }

    record GeneratedFeedback(
            List<String> strengths,
            List<String> improvements,
            String suggestedAnswer,
            List<String> followups
    ) {
    }

    List<GeneratedQuizQuestion> generateQuestions(
            String systemInstruction,
            Set<CsQuizTopic> topics,
            CsQuizDifficulty difficulty,
            int multipleChoiceCount,
            int shortAnswerCount
    );

    GeneratedFeedback generateMultipleChoiceFeedback(
            String systemInstruction,
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            String question,
            List<String> choices,
            int correctChoiceIndex,
            int selectedChoiceIndex
    );

    GeneratedFeedback generateShortAnswerFeedback(
            String systemInstruction,
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            String question,
            String referenceAnswer,
            List<String> rubricKeywords,
            String userAnswer
    );
}

