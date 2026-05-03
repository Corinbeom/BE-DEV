package com.devweb.api.speechinterview;

import com.devweb.api.speechinterview.dto.CreateSpeechInterviewRequest;
import com.devweb.api.speechinterview.dto.SubmitSpeechAnswerRequest;
import com.devweb.common.ResourceNotFoundException;
import com.devweb.common.UnauthorizedException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.domain.resume.session.model.ResumeQuestion;
import com.devweb.domain.resume.session.model.ResumeSession;
import com.devweb.domain.resume.session.port.InterviewAiPort;
import com.devweb.domain.resume.session.port.ResumeSessionRepository;
import com.devweb.domain.resume.session.service.PositionPromptRegistry;
import com.devweb.domain.speechinterview.model.*;
import com.devweb.domain.speechinterview.port.SpeechInterviewSessionRepository;
import com.devweb.infra.ai.AiTextSanitizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SpeechInterviewService {

    private static final Logger log = LoggerFactory.getLogger(SpeechInterviewService.class);

    private final SpeechInterviewSessionRepository speechRepo;
    private final ResumeSessionRepository resumeSessionRepo;
    private final MemberRepository memberRepo;
    private final InterviewAiPort aiPort;
    private final PositionPromptRegistry promptRegistry;

    public SpeechInterviewService(
            SpeechInterviewSessionRepository speechRepo,
            ResumeSessionRepository resumeSessionRepo,
            MemberRepository memberRepo,
            InterviewAiPort aiPort,
            PositionPromptRegistry promptRegistry
    ) {
        this.speechRepo = speechRepo;
        this.resumeSessionRepo = resumeSessionRepo;
        this.memberRepo = memberRepo;
        this.aiPort = aiPort;
        this.promptRegistry = promptRegistry;
    }

    /** ResumeSession에서 질문을 스냅샷 복사하여 SpeechInterviewSession 생성 */
    public SpeechInterviewSession createSession(Long memberId, CreateSpeechInterviewRequest req) {
        Member member = memberRepo.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member를 찾을 수 없습니다. id=" + memberId));

        ResumeSession resumeSession = resumeSessionRepo.findById(req.resumeSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("ResumeSession을 찾을 수 없습니다. id=" + req.resumeSessionId()));

        if (!resumeSession.getMember().getId().equals(memberId)) {
            throw new UnauthorizedException("해당 ResumeSession에 접근할 권한이 없습니다.");
        }

        SpeechInterviewSession session = new SpeechInterviewSession(
                member,
                resumeSession.getTitle(),
                resumeSession.getPositionType(),
                resumeSession.getId(),
                req.useCamera()
        );

        List<ResumeQuestion> resumeQuestions = resumeSession.getQuestions();
        for (ResumeQuestion rq : resumeQuestions) {
            if (rq.getInterviewQuestion() == null) continue;
            var iq = rq.getInterviewQuestion();
            String questionText = iq.getQuestion();
            if (questionText == null || questionText.isBlank()) continue;

            SpeechInterviewQuestion sq = new SpeechInterviewQuestion(
                    rq.getOrderIndex(),
                    rq.getBadge(),
                    questionText,
                    iq.getIntention(),
                    iq.getKeywords(),
                    iq.getModelAnswer()
            );
            session.addQuestion(sq);
        }

        return speechRepo.save(session);
    }

    /** 답변 제출 — 즉시 저장 후 @Async AI 피드백 생성 */
    public SpeechInterviewSession submitAnswer(Long memberId, Long sessionId, SubmitSpeechAnswerRequest req) {
        SpeechInterviewSession session = findAndAuthorize(memberId, sessionId);

        SpeechInterviewQuestion question = session.getQuestions().stream()
                .filter(q -> q.getId().equals(req.questionId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("질문을 찾을 수 없습니다. id=" + req.questionId()));

        SubmitSpeechAnswerRequest.BehavioralMetricsDto m = req.behavioralMetrics();
        SpeechInterviewAnswer answer = new SpeechInterviewAnswer(
                req.answerText(),
                m != null ? m.eyeContactRatio() : null,
                m != null ? m.postureStability() : null,
                m != null ? m.expressionVariety() : null,
                m != null ? m.fidgetingScore() : null
        );

        question.attachAnswer(answer);
        SpeechInterviewSession saved = speechRepo.save(session);

        // 저장 완료 후 ID 확보해서 비동기 피드백 생성
        generateFeedbackAsync(
                sessionId,
                question.getId(),
                req.answerText(),
                question.getQuestionText(),
                question.getIntention(),
                question.getKeywords(),
                question.getModelAnswer(),
                m,
                session.getPositionType()
        );

        return saved;
    }

    /** 세션 완료 처리 */
    public SpeechInterviewSession completeSession(Long memberId, Long sessionId) {
        SpeechInterviewSession session = findAndAuthorize(memberId, sessionId);
        session.complete();
        return speechRepo.save(session);
    }

    /** 내 세션 목록 조회 */
    @Transactional(readOnly = true)
    public List<SpeechInterviewSession> listSessions(Long memberId) {
        return speechRepo.findByMemberIdOrderByCreatedAtDesc(memberId);
    }

    /** 세션 상세 조회 */
    @Transactional(readOnly = true)
    public SpeechInterviewSession getSession(Long memberId, Long sessionId) {
        return findAndAuthorize(memberId, sessionId);
    }

    // ─── private helpers ─────────────────────────────────────────────────────

    private SpeechInterviewSession findAndAuthorize(Long memberId, Long sessionId) {
        SpeechInterviewSession session = speechRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("SpeechInterviewSession을 찾을 수 없습니다. id=" + sessionId));
        if (!session.getMember().getId().equals(memberId)) {
            throw new UnauthorizedException("해당 세션에 접근할 권한이 없습니다.");
        }
        return session;
    }

    @Async
    @Transactional
    public void generateFeedbackAsync(Long sessionId, Long questionId,
                                       String answerText,
                                       String questionText, String intention,
                                       String keywords, String modelAnswer,
                                       SubmitSpeechAnswerRequest.BehavioralMetricsDto metricsDto,
                                       String positionType) {
        try {
            String systemInstruction = promptRegistry.systemInstructionFor(positionType);

            InterviewAiPort.GeneratedFeedback generated;
            if (metricsDto != null) {
                InterviewAiPort.BehavioralMetrics metrics = new InterviewAiPort.BehavioralMetrics(
                        metricsDto.eyeContactRatio(),
                        metricsDto.postureStability(),
                        metricsDto.expressionVariety(),
                        metricsDto.fidgetingScore()
                );
                generated = aiPort.generateFeedbackWithBehavior(
                        systemInstruction, questionText, intention, keywords, modelAnswer, answerText, metrics);
            } else {
                generated = aiPort.generateFeedback(
                        systemInstruction, questionText, intention, keywords, modelAnswer, answerText);
            }

            SpeechAnswerFeedback feedback = new SpeechAnswerFeedback(
                    AiTextSanitizer.sanitizeList(generated.strengths()),
                    AiTextSanitizer.sanitizeList(generated.improvements()),
                    AiTextSanitizer.sanitize(generated.suggestedAnswer()),
                    AiTextSanitizer.sanitizeList(generated.followups()),
                    AiTextSanitizer.sanitizeList(generated.deliveryStrengths()),
                    AiTextSanitizer.sanitizeList(generated.deliveryImprovements())
            );

            updateAnswerWithFeedback(sessionId, questionId, feedback, true);
        } catch (Exception e) {
            log.error("SpeechInterview 피드백 생성 실패 sessionId={} questionId={}", sessionId, questionId, e);
            updateAnswerWithFeedback(sessionId, questionId, null, false);
        }
    }

    private void updateAnswerWithFeedback(Long sessionId, Long questionId,
                                           SpeechAnswerFeedback feedback, boolean success) {
        speechRepo.findById(sessionId).ifPresent(session -> {
            session.getQuestions().stream()
                    .filter(q -> q.getId().equals(questionId))
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
