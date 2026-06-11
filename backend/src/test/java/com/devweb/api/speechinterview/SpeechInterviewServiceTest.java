package com.devweb.api.speechinterview;

import com.devweb.api.speechinterview.dto.ChatRequest;
import com.devweb.api.speechinterview.dto.ChatResponse;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.domain.resume.session.port.InterviewAiPort;
import com.devweb.domain.resume.session.port.ResumeSessionRepository;
import com.devweb.domain.resume.session.service.PositionPromptRegistry;
import com.devweb.domain.speechinterview.model.SpeechInterviewSession;
import com.devweb.domain.speechinterview.model.SpeechInterviewStatus;
import com.devweb.domain.speechinterview.port.SpeechInterviewSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.context.ApplicationEventPublisher;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SpeechInterviewServiceTest {

    @Mock SpeechInterviewSessionRepository speechRepo;
    @Mock ResumeSessionRepository resumeSessionRepo;
    @Mock MemberRepository memberRepo;
    @Mock InterviewAiPort aiPort;
    @Mock PositionPromptRegistry promptRegistry;
    @Mock ApplicationEventPublisher eventPublisher;

    @InjectMocks SpeechInterviewService sut;

    private Member member;
    private SpeechInterviewSession session;

    @BeforeEach
    void setUp() {
        member = new Member("test@example.com");
        ReflectionTestUtils.setField(member, "id", 1L);
        session = new SpeechInterviewSession(member, "백엔드 면접", "BACKEND", 1L);
        given(speechRepo.findById(anyLong())).willReturn(Optional.of(session));
    }

    @Test
    @DisplayName("첫 번째 채팅 턴 — CREATED → IN_PROGRESS 전이 + AI 응답 반환")
    void chat_firstTurn_returnsInterviewerMessage() {
        given(promptRegistry.systemInstructionFor(any())).willReturn("system instruction");
        given(aiPort.conductInterview(any(), any(), any(), any(), anyInt(), anyInt()))
                .willReturn(new InterviewAiPort.GeneratedInterviewerTurn(
                        "자기소개 부탁드립니다.", "자기소개", false, "진행방향 확인", "첫인상"));
        given(speechRepo.save(any())).willAnswer(inv -> inv.getArgument(0));

        ChatResponse response = sut.chat(1L, 1L, new ChatRequest(""));

        assertThat(session.getStatus()).isEqualTo(SpeechInterviewStatus.IN_PROGRESS);
        assertThat(response.aiMessage()).isEqualTo("자기소개 부탁드립니다.");
        assertThat(response.isComplete()).isFalse();
    }

    @Test
    @DisplayName("MAX_TURNS 도달 — session.complete() 호출 + isComplete=true 반환")
    void chat_maxTurns_completesSession() {
        // 8개 질문을 미리 추가하되, 모두 답변이 있는 상태로 만들어 generateFeedbackAsync 미호출
        for (int i = 0; i < 8; i++) {
            var q = new com.devweb.domain.speechinterview.model.SpeechInterviewQuestion(
                    i, "질문" + i, "내용" + i, null, null, null);
            session.addQuestion(q);
            q.attachAnswer(new com.devweb.domain.speechinterview.model.SpeechInterviewAnswer("답변" + i));
        }
        session.startInterview();
        given(speechRepo.save(any())).willAnswer(inv -> inv.getArgument(0));

        ChatResponse response = sut.chat(1L, 1L, new ChatRequest(""));

        assertThat(session.getStatus()).isEqualTo(SpeechInterviewStatus.COMPLETED);
        assertThat(response.isComplete()).isTrue();
    }

    @Test
    @DisplayName("답변 저장 후 피드백 생성 이벤트를 발행한다")
    void chat_answeredQuestion_publishesFeedbackRequestedEvent() {
        var q = new com.devweb.domain.speechinterview.model.SpeechInterviewQuestion(
                0, "질문", "Spring 트랜잭션을 설명해 주세요.", "트랜잭션 이해", "Spring", null);
        ReflectionTestUtils.setField(q, "id", 10L);
        session.addQuestion(q);
        session.startInterview();
        given(promptRegistry.systemInstructionFor(any())).willReturn("system instruction");
        given(aiPort.conductInterview(any(), any(), any(), any(), anyInt(), anyInt()))
                .willReturn(new InterviewAiPort.GeneratedInterviewerTurn(
                        "다음 질문입니다.", "심화", false, "추가 검증", "JPA"));
        given(speechRepo.save(any())).willAnswer(inv -> inv.getArgument(0));

        sut.chat(1L, 1L, new ChatRequest("격리 수준과 전파 옵션이 중요합니다."));

        verify(eventPublisher).publishEvent((Object) argThat(event -> {
            SpeechInterviewFeedbackRequestedEvent feedbackEvent = (SpeechInterviewFeedbackRequestedEvent) event;
            return feedbackEvent.sessionId().equals(1L)
                    && feedbackEvent.questionId().equals(10L)
                    && feedbackEvent.answerText().equals("격리 수준과 전파 옵션이 중요합니다.")
                    && feedbackEvent.questionText().equals("Spring 트랜잭션을 설명해 주세요.");
        }));
    }

    @Test
    @DisplayName("complete() — IN_PROGRESS 아닌 상태에서 재호출 시 IllegalArgumentException")
    void complete_alreadyCompleted_throwsIllegalArgumentException() {
        session.startInterview();
        session.complete();

        assertThatThrownBy(session::complete)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("IN_PROGRESS");
    }
}
