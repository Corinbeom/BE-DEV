package com.devweb.api.resume.question;

import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.resume.model.InterviewQuestion;
import com.devweb.domain.resume.session.model.*;
import com.devweb.domain.resume.session.port.ResumeQuestionRepository;
import com.devweb.domain.resume.session.service.AnswerFeedbackGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class ResumeQuestionServiceTest {

    @Mock ResumeQuestionRepository questionRepository;
    @Mock AnswerFeedbackGenerator feedbackGenerator;

    @InjectMocks ResumeQuestionService sut;

    private Member member;
    private ResumeSession session;
    private ResumeQuestion question;

    @BeforeEach
    void setUp() {
        member = new Member("test@example.com");
        session = new ResumeSession(member, PositionType.BE, "테스트 세션", null);
        InterviewQuestion vo = new InterviewQuestion(
                "자기소개를 해주세요.",
                "지원자의 배경 파악",
                "경험, 기술스택, 강점",
                "간결하고 핵심 위주로 설명"
        );
        question = new ResumeQuestion(0, "자기소개", 90, vo);
        // session 연결 (테스트 목적)
        try {
            var sessionField = ResumeQuestion.class.getDeclaredField("session");
            sessionField.setAccessible(true);
            sessionField.set(question, session);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // ─────────────────────────────────────────────
    // createFeedback 정상
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("답변 피드백 생성 성공")
    void createFeedback_성공() {
        // given
        given(questionRepository.findById(1L)).willReturn(Optional.of(question));

        Feedback feedback = new Feedback(
                List.of("핵심을 잘 짚었어요"),
                List.of("구체적 예시를 추가하세요"),
                "백엔드 개발자로서의 경험을 중심으로...",
                List.of("어떤 프로젝트가 가장 기억에 남나요?")
        );
        given(feedbackGenerator.generate(any(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .willReturn(feedback);
        given(questionRepository.save(any())).willReturn(question);

        // when
        ResumeAnswerAttempt result = sut.createFeedback(1L, "저는 3년 차 백엔드 개발자입니다.");

        // then
        assertThat(result).isNotNull();
        assertThat(result.getAnswerText()).isEqualTo("저는 3년 차 백엔드 개발자입니다.");
        assertThat(result.getFeedback().getStrengths()).containsExactly("핵심을 잘 짚었어요");
        then(feedbackGenerator).should().generate(
                eq(PositionType.BE),
                eq("자기소개를 해주세요."),
                anyString(), anyString(), anyString(),
                eq("저는 3년 차 백엔드 개발자입니다.")
        );
    }

    // ─────────────────────────────────────────────
    // createFeedback 실패
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("존재하지 않는 questionId면 ResourceNotFoundException")
    void createFeedback_존재하지않는_질문_예외() {
        given(questionRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sut.createFeedback(99L, "내 답변"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    @DisplayName("여러 번 피드백 요청 시 attempts 목록에 누적")
    void createFeedback_여러번_요청_시_attempts_누적() {
        // given
        given(questionRepository.findById(1L)).willReturn(Optional.of(question));
        given(feedbackGenerator.generate(any(), anyString(), any(), any(), any(), anyString()))
                .willReturn(new Feedback(List.of("좋아요"), List.of(), "모범 답변", List.of()));
        given(questionRepository.save(any())).willReturn(question);

        // when
        sut.createFeedback(1L, "첫 번째 답변");
        sut.createFeedback(1L, "두 번째 답변");

        // then
        assertThat(question.getAttempts()).hasSize(2);
        then(feedbackGenerator).should(times(2)).generate(any(), anyString(), any(), any(), any(), anyString());
    }
}
