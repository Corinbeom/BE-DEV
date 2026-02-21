package com.devweb.domain.resume.session.service;

import com.devweb.domain.resume.session.model.Feedback;
import com.devweb.domain.resume.session.model.PositionType;
import com.devweb.domain.resume.session.port.InterviewAiPort;
import org.springframework.stereotype.Component;

@Component
public class AnswerFeedbackGenerator {

    private final InterviewAiPort aiPort;
    private final PositionPromptStrategies promptStrategies;

    public AnswerFeedbackGenerator(InterviewAiPort aiPort, PositionPromptStrategies promptStrategies) {
        this.aiPort = aiPort;
        this.promptStrategies = promptStrategies;
    }

    public Feedback generate(PositionType positionType, String question, String intention, String keywords, String modelAnswer, String answerText) {
        String systemInstruction = promptStrategies.systemInstructionFor(positionType);
        InterviewAiPort.GeneratedFeedback f =
                aiPort.generateFeedback(systemInstruction, question, intention, keywords, modelAnswer, answerText);
        return new Feedback(f.strengths(), f.improvements(), f.suggestedAnswer(), f.followups());
    }
}

