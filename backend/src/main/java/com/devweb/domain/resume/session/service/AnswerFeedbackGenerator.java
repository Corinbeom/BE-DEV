package com.devweb.domain.resume.session.service;

import com.devweb.domain.resume.session.model.Feedback;
import com.devweb.domain.resume.session.port.InterviewAiPort;
import com.devweb.infra.ai.AiTextSanitizer;
import org.springframework.stereotype.Component;

@Component
public class AnswerFeedbackGenerator {

    private final InterviewAiPort aiPort;
    private final PositionPromptRegistry promptRegistry;

    public AnswerFeedbackGenerator(InterviewAiPort aiPort, PositionPromptRegistry promptRegistry) {
        this.aiPort = aiPort;
        this.promptRegistry = promptRegistry;
    }

    public Feedback generate(String positionType, String question, String intention, String keywords, String modelAnswer, String answerText) {
        String systemInstruction = promptRegistry.systemInstructionFor(positionType);
        InterviewAiPort.GeneratedFeedback f =
                aiPort.generateFeedback(systemInstruction, question, intention, keywords, modelAnswer, answerText);
        return new Feedback(
                AiTextSanitizer.sanitizeList(f.strengths()),
                AiTextSanitizer.sanitizeList(f.improvements()),
                AiTextSanitizer.sanitize(f.suggestedAnswer()),
                AiTextSanitizer.sanitizeList(f.followups()));
    }
}
