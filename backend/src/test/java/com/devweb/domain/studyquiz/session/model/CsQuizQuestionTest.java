package com.devweb.domain.studyquiz.session.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

class CsQuizQuestionTest {

    // ─────────────────────────────────────────────
    // 팩토리 메서드 - multipleChoice
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("객관식 문제 정상 생성")
    void multipleChoice_생성_성공() {
        CsQuizQuestion q = CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.OS, CsQuizDifficulty.MID,
                "프로세스와 스레드의 차이는?",
                List.of("A", "B", "C", "D"), 1, "B가 정답"
        );

        assertThat(q.isMultipleChoice()).isTrue();
        assertThat(q.isShortAnswer()).isFalse();
        assertThat(q.getTopic()).isEqualTo(CsQuizTopic.OS);
        assertThat(q.getDifficulty()).isEqualTo(CsQuizDifficulty.MID);
        assertThat(q.getPrompt()).isEqualTo("프로세스와 스레드의 차이는?");
        assertThat(q.getChoices()).hasSize(4);
        assertThat(q.getCorrectChoiceIndexForGrading()).isEqualTo(1);
    }

    @Test
    @DisplayName("choices가 null이면 IllegalArgumentException")
    void multipleChoice_choices_null_예외() {
        assertThatThrownBy(() -> CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.OS, CsQuizDifficulty.LOW,
                "문제", null, 0, "답변"
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("choices");
    }

    @Test
    @DisplayName("choices가 1개이면 IllegalArgumentException")
    void multipleChoice_choices_1개_예외() {
        assertThatThrownBy(() -> CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.OS, CsQuizDifficulty.LOW,
                "문제", List.of("하나뿐"), 0, "답변"
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("choices");
    }

    @Test
    @DisplayName("correctChoiceIndex가 음수이면 IllegalArgumentException")
    void multipleChoice_correctIndex_음수_예외() {
        assertThatThrownBy(() -> CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.OS, CsQuizDifficulty.LOW,
                "문제", List.of("A", "B"), -1, "답변"
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("correctChoiceIndex");
    }

    @Test
    @DisplayName("correctChoiceIndex가 choices 크기 이상이면 IllegalArgumentException")
    void multipleChoice_correctIndex_범위초과_예외() {
        assertThatThrownBy(() -> CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.OS, CsQuizDifficulty.LOW,
                "문제", List.of("A", "B"), 2, "답변"  // index 2는 범위 초과
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("correctChoiceIndex");
    }

    @Test
    @DisplayName("prompt가 blank이면 IllegalArgumentException")
    void multipleChoice_빈_prompt_예외() {
        assertThatThrownBy(() -> CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.OS, CsQuizDifficulty.LOW,
                "   ", List.of("A", "B"), 0, "답변"
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("prompt");
    }

    @Test
    @DisplayName("topic이 null이면 IllegalArgumentException")
    void multipleChoice_topic_null_예외() {
        assertThatThrownBy(() -> CsQuizQuestion.multipleChoice(
                0, null, CsQuizDifficulty.LOW,
                "문제", List.of("A", "B"), 0, "답변"
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("topic");
    }

    // ─────────────────────────────────────────────
    // 팩토리 메서드 - shortAnswer
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("단답형 문제 정상 생성")
    void shortAnswer_생성_성공() {
        CsQuizQuestion q = CsQuizQuestion.shortAnswer(
                0, CsQuizTopic.NETWORK, CsQuizDifficulty.HIGH,
                "TCP와 UDP의 차이를 설명하세요.",
                List.of("신뢰성", "연결지향"),
                "TCP는 연결지향 프로토콜"
        );

        assertThat(q.isShortAnswer()).isTrue();
        assertThat(q.isMultipleChoice()).isFalse();
        assertThat(q.getChoices()).isEmpty();
        assertThat(q.getRubricKeywords()).containsExactly("신뢰성", "연결지향");
    }

    @Test
    @DisplayName("단답형 rubricKeywords가 null이어도 정상 생성")
    void shortAnswer_rubricKeywords_null_허용() {
        CsQuizQuestion q = CsQuizQuestion.shortAnswer(
                0, CsQuizTopic.DB, CsQuizDifficulty.LOW,
                "인덱스란?", null, "빠른 검색을 위한 자료구조"
        );

        assertThat(q.getRubricKeywords()).isEmpty();
    }

    // ─────────────────────────────────────────────
    // isCorrectChoiceIndex
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("정답 인덱스를 선택하면 true 반환")
    void isCorrectChoiceIndex_정답_true() {
        CsQuizQuestion q = mcQuestion(2);
        assertThat(q.isCorrectChoiceIndex(2)).isTrue();
    }

    @Test
    @DisplayName("오답 인덱스를 선택하면 false 반환")
    void isCorrectChoiceIndex_오답_false() {
        CsQuizQuestion q = mcQuestion(2);
        assertThat(q.isCorrectChoiceIndex(0)).isFalse();
        assertThat(q.isCorrectChoiceIndex(1)).isFalse();
        assertThat(q.isCorrectChoiceIndex(3)).isFalse();
    }

    @Test
    @DisplayName("선택 인덱스가 null이면 false 반환")
    void isCorrectChoiceIndex_null이면_false() {
        CsQuizQuestion q = mcQuestion(0);
        assertThat(q.isCorrectChoiceIndex(null)).isFalse();
    }

    @Test
    @DisplayName("단답형 문제에서 isCorrectChoiceIndex 호출 시 IllegalStateException")
    void isCorrectChoiceIndex_단답형에서_예외() {
        CsQuizQuestion q = CsQuizQuestion.shortAnswer(
                0, CsQuizTopic.OS, CsQuizDifficulty.LOW, "문제", null, "답"
        );
        assertThatThrownBy(() -> q.isCorrectChoiceIndex(0))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("객관식");
    }

    // ─────────────────────────────────────────────
    // getCorrectChoiceIndexForGrading
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("단답형 문제에서 getCorrectChoiceIndexForGrading 호출 시 IllegalStateException")
    void getCorrectChoiceIndexForGrading_단답형에서_예외() {
        CsQuizQuestion q = CsQuizQuestion.shortAnswer(
                0, CsQuizTopic.OS, CsQuizDifficulty.LOW, "문제", null, "답"
        );
        assertThatThrownBy(q::getCorrectChoiceIndexForGrading)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("객관식");
    }

    // ─────────────────────────────────────────────
    // getChoices 불변성
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("getChoices() 반환값은 수정 불가(unmodifiableList)")
    void getChoices_불변성() {
        CsQuizQuestion q = mcQuestion(0);
        assertThatThrownBy(() -> q.getChoices().add("새 선택지"))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    // ─────────────────────────────────────────────
    // 헬퍼
    // ─────────────────────────────────────────────

    private CsQuizQuestion mcQuestion(int correctIndex) {
        return CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.OS, CsQuizDifficulty.MID,
                "테스트 객관식 문제",
                List.of("선택A", "선택B", "선택C", "선택D"),
                correctIndex, "참조 답변"
        );
    }
}
