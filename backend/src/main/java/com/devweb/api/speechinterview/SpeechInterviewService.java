package com.devweb.api.speechinterview;

import com.devweb.api.speechinterview.dto.ChatRequest;
import com.devweb.api.speechinterview.dto.ChatResponse;
import com.devweb.api.speechinterview.dto.CreateSpeechInterviewRequest;
import com.devweb.common.ResourceNotFoundException;
import com.devweb.common.UnauthorizedException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
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

import java.util.ArrayList;
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

    private static final int MAX_TURNS = 8;
    private static final int MAX_RESUME_CONTEXT_CHARS = 2000;

    /** ResumeSession에서 이력서 컨텍스트를 추출하여 대화형 SpeechInterviewSession 생성 */
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
                resumeSession.getId()
        );

        // 이력서/포트폴리오 텍스트를 truncate해서 resumeContext 저장
        String resumeText = truncate(resumeSession.getResumeText(), MAX_RESUME_CONTEXT_CHARS);
        String portfolioText = truncate(resumeSession.getPortfolioText(), MAX_RESUME_CONTEXT_CHARS / 2);
        String context = buildResumeContext(resumeText, portfolioText);
        session.storeResumeContext(context);

        return speechRepo.save(session);
    }

    /** 대화형 면접 턴 처리 */
    public ChatResponse chat(Long memberId, Long sessionId, ChatRequest req) {
        SpeechInterviewSession session = findAndAuthorize(memberId, sessionId);

        if (session.getStatus() == SpeechInterviewStatus.COMPLETED) {
            throw new IllegalArgumentException("이미 완료된 면접 세션입니다.");
        }

        // 세션 상태 전이: CREATED → IN_PROGRESS (첫 턴)
        if (session.getStatus() == SpeechInterviewStatus.CREATED) {
            session.startInterview();
        }

        List<SpeechInterviewQuestion> questions = new ArrayList<>(session.getQuestions());
        int turnCount = questions.size(); // 이미 저장된 질문 수 = 현재까지의 AI 턴 수

        // 첫 턴이 아니면: 이전 질문에 사용자 답변 저장 + 비동기 피드백 생성
        if (!questions.isEmpty()) {
            SpeechInterviewQuestion lastQuestion = questions.get(questions.size() - 1);
            if (lastQuestion.getAnswer() == null) {
                SpeechInterviewAnswer answer = new SpeechInterviewAnswer(req.userMessage());
                lastQuestion.attachAnswer(answer);
                speechRepo.save(session);

                // 비동기 피드백 생성
                generateFeedbackAsync(
                        sessionId,
                        lastQuestion.getId(),
                        req.userMessage(),
                        lastQuestion.getQuestionText(),
                        lastQuestion.getIntention(),
                        lastQuestion.getKeywords(),
                        lastQuestion.getModelAnswer(),
                        session.getPositionType()
                );
            }
        }

        // 최대 턴 초과 시 강제 종료
        if (turnCount >= MAX_TURNS) {
            session.complete();
            speechRepo.save(session);
            return new ChatResponse("수고하셨습니다! 면접이 완료되었습니다. 결과를 확인해 보세요.", turnCount, true, null, null);
        }

        // 대화 히스토리 구축 (question=model, answer=user)
        // 답변이 이미 lastQuestion에 저장됐으면 latestUserMessage는 빈 문자열로 전달 (중복 방지)
        List<InterviewAiPort.ChatMessage> history = buildHistory(questions, "");

        // Gemini conductInterview 호출
        String systemInstruction = promptRegistry.systemInstructionFor(session.getPositionType());
        InterviewAiPort.GeneratedInterviewerTurn turn;
        try {
            turn = aiPort.conductInterview(
                    systemInstruction,
                    session.getResumeContext(),
                    session.getPositionType(),
                    history,
                    turnCount,
                    MAX_TURNS
            );
        } catch (Exception e) {
            log.error("AI 면접관 응답 생성 실패 sessionId={}", sessionId, e);
            throw new RuntimeException("면접관 응답을 일시적으로 생성할 수 없습니다. 잠시 후 다시 시도해 주세요.", e);
        }

        Long newQuestionId = null;
        if (!turn.isComplete()) {
            // 새 질문 엔티티 생성 및 세션에 추가
            SpeechInterviewQuestion newQuestion = new SpeechInterviewQuestion(
                    turnCount,
                    turn.badge() != null ? turn.badge() : "면접 질문",
                    turn.message(),
                    turn.intention(),
                    turn.keywords(),
                    null // 대화형에서는 모범답안 미생성
            );
            session.addQuestion(newQuestion);
            SpeechInterviewSession saved = speechRepo.save(session);
            // 저장 후 ID 획득
            List<SpeechInterviewQuestion> savedQuestions = saved.getQuestions();
            if (!savedQuestions.isEmpty()) {
                newQuestionId = savedQuestions.get(savedQuestions.size() - 1).getId();
            }
        } else {
            session.complete();
            speechRepo.save(session);
        }

        return new ChatResponse(turn.message(), turnCount + 1, turn.isComplete(), newQuestionId, turn.badge());
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
                                       String positionType) {
        try {
            String systemInstruction = promptRegistry.systemInstructionFor(positionType);

            InterviewAiPort.GeneratedFeedback generated = aiPort.generateFeedback(
                    systemInstruction, questionText, intention, keywords, modelAnswer, answerText);

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

    /** 대화 히스토리 구축: question=model, answer=user */
    private List<InterviewAiPort.ChatMessage> buildHistory(List<SpeechInterviewQuestion> questions, String latestUserMessage) {
        List<InterviewAiPort.ChatMessage> history = new ArrayList<>();
        for (SpeechInterviewQuestion q : questions) {
            history.add(new InterviewAiPort.ChatMessage("model", q.getQuestionText()));
            if (q.getAnswer() != null) {
                history.add(new InterviewAiPort.ChatMessage("user", q.getAnswer().getAnswerText()));
            }
        }
        // 최신 사용자 메시지 추가 (아직 DB에 저장되지 않은 현재 턴)
        if (!latestUserMessage.isBlank()) {
            history.add(new InterviewAiPort.ChatMessage("user", latestUserMessage));
        }
        return history;
    }

    private String buildResumeContext(String resumeText, String portfolioText) {
        StringBuilder sb = new StringBuilder();
        if (resumeText != null && !resumeText.isBlank()) {
            sb.append("[이력서]\n").append(resumeText);
        }
        if (portfolioText != null && !portfolioText.isBlank()) {
            if (sb.length() > 0) sb.append("\n\n");
            sb.append("[포트폴리오]\n").append(portfolioText);
        }
        return sb.toString();
    }

    private static String truncate(String text, int maxChars) {
        if (text == null) return null;
        if (text.length() <= maxChars) return text;
        return text.substring(0, maxChars);
    }

}
