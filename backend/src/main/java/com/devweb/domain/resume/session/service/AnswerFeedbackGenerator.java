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
        return generate(positionType, question, intention, keywords, modelAnswer, answerText, null);
    }

    public Feedback generate(String positionType, String question, String intention, String keywords, String modelAnswer, String answerText,
                              InterviewAiPort.BehavioralMetrics behavioralMetrics) {
        String systemInstruction = promptRegistry.systemInstructionFor(positionType);
        InterviewAiPort.GeneratedFeedback f = behavioralMetrics != null
                ? aiPort.generateFeedbackWithBehavior(systemInstruction, question, intention, keywords, modelAnswer, answerText, behavioralMetrics)
                : aiPort.generateFeedback(systemInstruction, question, intention, keywords, modelAnswer, answerText);
        return new Feedback(
                AiTextSanitizer.sanitizeList(f.strengths()),
                AiTextSanitizer.sanitizeList(f.improvements()),
                AiTextSanitizer.sanitize(f.suggestedAnswer()),
                AiTextSanitizer.sanitizeList(f.followups()),
                AiTextSanitizer.sanitizeList(f.deliveryStrengths()),
                AiTextSanitizer.sanitizeList(f.deliveryImprovements()));
    }
}
