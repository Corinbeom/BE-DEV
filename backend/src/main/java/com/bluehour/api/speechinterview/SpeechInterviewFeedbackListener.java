package com.bluehour.api.speechinterview;

import com.bluehour.domain.resume.session.port.InterviewAiPort;
import com.bluehour.domain.resume.session.service.PositionPromptRegistry;
import com.bluehour.domain.speechinterview.model.SpeechAnswerFeedback;
import com.bluehour.domain.speechinterview.port.SpeechInterviewSessionRepository;
import com.bluehour.infra.ai.AiTextSanitizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Objects;

@Component
public class SpeechInterviewFeedbackListener {

    private static final Logger log = LoggerFactory.getLogger(SpeechInterviewFeedbackListener.class);

    private final SpeechInterviewSessionRepository speechRepo;
    private final InterviewAiPort aiPort;
    private final PositionPromptRegistry promptRegistry;

    public SpeechInterviewFeedbackListener(
            SpeechInterviewSessionRepository speechRepo,
            InterviewAiPort aiPort,
            PositionPromptRegistry promptRegistry
    ) {
        this.speechRepo = speechRepo;
        this.aiPort = aiPort;
        this.promptRegistry = promptRegistry;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void generateFeedback(SpeechInterviewFeedbackRequestedEvent event) {
        try {
            String systemInstruction = promptRegistry.systemInstructionFor(event.positionType());

            InterviewAiPort.GeneratedFeedback generated = aiPort.generateFeedback(
                    systemInstruction,
                    event.questionText(),
                    event.intention(),
                    event.keywords(),
                    event.modelAnswer(),
                    event.answerText()
            );

            SpeechAnswerFeedback feedback = new SpeechAnswerFeedback(
                    AiTextSanitizer.sanitizeList(generated.strengths()),
                    AiTextSanitizer.sanitizeList(generated.improvements()),
                    AiTextSanitizer.sanitize(generated.suggestedAnswer()),
                    AiTextSanitizer.sanitizeList(generated.followups()),
                    AiTextSanitizer.sanitizeList(generated.deliveryStrengths()),
                    AiTextSanitizer.sanitizeList(generated.deliveryImprovements())
            );

            updateAnswerWithFeedback(event.sessionId(), event.questionId(), feedback, true);
        } catch (Exception e) {
            log.error("SpeechInterview 피드백 생성 실패 sessionId={} questionId={}",
                    event.sessionId(), event.questionId(), e);
            updateAnswerWithFeedback(event.sessionId(), event.questionId(), null, false);
        }
    }

    private void updateAnswerWithFeedback(
            Long sessionId,
            Long questionId,
            SpeechAnswerFeedback feedback,
            boolean success
    ) {
        speechRepo.findById(sessionId).ifPresent(session -> {
            session.getQuestions().stream()
                    .filter(q -> Objects.equals(q.getId(), questionId))
                    .findFirst()
                    .ifPresent(q -> {
                        if (q.getAnswer() == null) return;
                        if (success) {
                            q.getAnswer().completeFeedback(feedback);
                        } else {
                            q.getAnswer().failFeedback();
                        }
                    });
            speechRepo.save(session);
        });
    }
}
