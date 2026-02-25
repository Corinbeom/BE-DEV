package com.devweb.api.studyquiz.question;

import com.devweb.api.studyquiz.question.dto.CreateCsQuizAttemptRequest;
import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.studyquiz.session.model.*;
import com.devweb.domain.studyquiz.session.port.CsQuizQuestionRepository;
import com.devweb.domain.studyquiz.session.service.CsQuizFeedbackGenerator;
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
class CsQuizQuestionServiceTest {

    @Mock CsQuizQuestionRepository questionRepository;
    @Mock CsQuizFeedbackGenerator feedbackGenerator;

    @InjectMocks CsQuizQuestionService sut;

    // ─────────────────────────────────────────────
    // 객관식(MULTIPLE_CHOICE) 테스트
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("객관식 정답 선택 시 AI 피드백 미호출, 고정 성공 피드백 반환")
    void submitAttempt_객관식_정답() {
        // given
        CsQuizQuestion question = mcQuestion(0); // correctChoiceIndex = 0
        given(questionRepository.findById(1L)).willReturn(Optional.of(question));
        given(questionRepository.save(any())).willReturn(question);

        CreateCsQuizAttemptRequest req = new CreateCsQuizAttemptRequest(0, null); // selectedChoiceIndex=0

        // when
        CsQuizAttempt attempt = sut.submitAttempt(1L, req);

        // then
        assertThat(attempt.isCorrect()).isTrue();
        assertThat(attempt.getSelectedChoiceIndex()).isEqualTo(0);
        then(feedbackGenerator).shouldHaveNoInteractions(); // AI 피드백 미호출
    }

    @Test
    @DisplayName("객관식 오답 선택 시 AI 피드백 호출, correct=false 반환")
    void submitAttempt_객관식_오답() {
        // given
        CsQuizQuestion question = mcQuestion(0); // correctChoiceIndex = 0
        given(questionRepository.findById(1L)).willReturn(Optional.of(question));

        CsQuizFeedback aiFeedback = new CsQuizFeedback(
                List.of("노력했어요"),
                List.of("핵심 개념을 다시 보세요"),
                "정답 설명",
                List.of("왜 그렇게 생각했나요?")
        );
        given(feedbackGenerator.generateForMultipleChoice(any(), any(), anyString(), anyList(), anyInt(), anyInt()))
                .willReturn(aiFeedback);
        given(questionRepository.save(any())).willReturn(question);

        CreateCsQuizAttemptRequest req = new CreateCsQuizAttemptRequest(2, null); // 오답

        // when
        CsQuizAttempt attempt = sut.submitAttempt(1L, req);

        // then
        assertThat(attempt.isCorrect()).isFalse();
        assertThat(attempt.getSelectedChoiceIndex()).isEqualTo(2);
        then(feedbackGenerator).should().generateForMultipleChoice(any(), any(), anyString(), anyList(), anyInt(), anyInt());
    }

    @Test
    @DisplayName("객관식 문제에 selectedChoiceIndex 없으면 IllegalArgumentException")
    void submitAttempt_객관식_selectedIndex_없으면_예외() {
        // given
        CsQuizQuestion question = mcQuestion(0);
        given(questionRepository.findById(1L)).willReturn(Optional.of(question));

        CreateCsQuizAttemptRequest req = new CreateCsQuizAttemptRequest(null, null); // MC에 selectedChoiceIndex=null

        // when & then
        assertThatThrownBy(() -> sut.submitAttempt(1L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("selectedChoiceIndex");
    }

    // ─────────────────────────────────────────────
    // 단답형(SHORT_ANSWER) 테스트
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("단답형 답변 제출 시 AI 피드백 호출")
    void submitAttempt_주관식_정상제출() {
        // given
        CsQuizQuestion question = saQuestion();
        given(questionRepository.findById(2L)).willReturn(Optional.of(question));

        CsQuizFeedback aiFeedback = new CsQuizFeedback(
                List.of("개념을 잘 설명했어요"),
                List.of("예시를 더 추가하면 좋겠어요"),
                "모범 답안",
                List.of("실제 사례를 들어 설명해보세요")
        );
        given(feedbackGenerator.generateForShortAnswer(any(), any(), anyString(), anyString(), anyList(), anyString()))
                .willReturn(aiFeedback);
        given(questionRepository.save(any())).willReturn(question);

        CreateCsQuizAttemptRequest req = new CreateCsQuizAttemptRequest(null, "내 답변입니다");

        // when
        CsQuizAttempt attempt = sut.submitAttempt(2L, req);

        // then
        assertThat(attempt.getAnswerText()).isEqualTo("내 답변입니다");
        assertThat(attempt.isCorrect()).isNull(); // 단답형은 correct 없음
        then(feedbackGenerator).should().generateForShortAnswer(any(), any(), anyString(), anyString(), anyList(), anyString());
    }

    @Test
    @DisplayName("단답형 문제에 answerText 없으면 IllegalArgumentException")
    void submitAttempt_주관식_answerText_없으면_예외() {
        // given
        CsQuizQuestion question = saQuestion();
        given(questionRepository.findById(2L)).willReturn(Optional.of(question));

        CreateCsQuizAttemptRequest req = new CreateCsQuizAttemptRequest(null, null);

        // when & then
        assertThatThrownBy(() -> sut.submitAttempt(2L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("answerText");
    }

    @Test
    @DisplayName("단답형 문제에 빈 answerText면 IllegalArgumentException")
    void submitAttempt_주관식_빈_answerText_예외() {
        // given
        CsQuizQuestion question = saQuestion();
        given(questionRepository.findById(2L)).willReturn(Optional.of(question));

        CreateCsQuizAttemptRequest req = new CreateCsQuizAttemptRequest(null, "   ");

        // when & then
        assertThatThrownBy(() -> sut.submitAttempt(2L, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("answerText");
    }

    // ─────────────────────────────────────────────
    // 존재하지 않는 문제
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("존재하지 않는 questionId면 ResourceNotFoundException")
    void submitAttempt_존재하지않는_문제() {
        // given
        given(questionRepository.findById(99L)).willReturn(Optional.empty());

        CreateCsQuizAttemptRequest req = new CreateCsQuizAttemptRequest(null, "답변");

        // when & then
        assertThatThrownBy(() -> sut.submitAttempt(99L, req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─────────────────────────────────────────────
    // 헬퍼 메서드
    // ─────────────────────────────────────────────

    private CsQuizQuestion mcQuestion(int correctIndex) {
        return CsQuizQuestion.multipleChoice(
                0,
                CsQuizTopic.OS,
                CsQuizDifficulty.MID,
                "프로세스와 스레드의 차이는?",
                List.of("메모리 공유", "독립 메모리", "CPU 점유", "커널 모드"),
                correctIndex,
                "프로세스는 독립 메모리, 스레드는 메모리 공유"
        );
    }

    private CsQuizQuestion saQuestion() {
        return CsQuizQuestion.shortAnswer(
                0,
                CsQuizTopic.NETWORK,
                CsQuizDifficulty.LOW,
                "TCP와 UDP의 차이를 설명하세요.",
                List.of("신뢰성", "연결지향", "흐름제어"),
                "TCP는 연결지향, UDP는 비연결 지향"
        );
    }
}
