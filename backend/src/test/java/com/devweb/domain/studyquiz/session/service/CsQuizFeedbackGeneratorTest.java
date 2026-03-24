package com.devweb.domain.studyquiz.session.service;

import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizFeedback;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import com.devweb.domain.studyquiz.session.port.CsQuizAiPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class CsQuizFeedbackGeneratorTest {

    @Mock CsQuizAiPort aiPort;

    @InjectMocks CsQuizFeedbackGenerator sut;

    @Test
    @DisplayName("객관식 AI 피드백 → CsQuizFeedback 변환 확인")
    void generateForMultipleChoice_정상_변환() {
        // given
        CsQuizAiPort.GeneratedFeedback gf = new CsQuizAiPort.GeneratedFeedback(
                List.of("정확한 개념 이해"),
                List.of("세부 사항 보완 필요"),
                "이상적인 답변 예시입니다.",
                List.of("관련 꼬리질문입니다.")
        );
        given(aiPort.generateMultipleChoiceFeedback(
                anyString(), any(), any(), anyString(), anyList(), anyInt(), anyInt()
        )).willReturn(gf);

        // when
        CsQuizFeedback result = sut.generateForMultipleChoice(
                CsQuizTopic.OS, CsQuizDifficulty.MID,
                "운영체제의 프로세스와 스레드 차이는?",
                List.of("A", "B", "C", "D"), 0, 1
        );

        // then
        assertThat(result.getStrengths()).containsExactly("정확한 개념 이해");
        assertThat(result.getImprovements()).containsExactly("세부 사항 보완 필요");
        assertThat(result.getSuggestedAnswer()).isEqualTo("이상적인 답변 예시입니다.");
        assertThat(result.getFollowups()).containsExactly("관련 꼬리질문입니다.");
    }

    @Test
    @DisplayName("단답형 AI 피드백 → CsQuizFeedback 변환 확인")
    void generateForShortAnswer_정상_변환() {
        // given
        CsQuizAiPort.GeneratedFeedback gf = new CsQuizAiPort.GeneratedFeedback(
                List.of("핵심 키워드 포함", "구조적 답변"),
                List.of("예시 추가 필요"),
                "모범 답안입니다.",
                List.of("꼬리질문1", "꼬리질문2")
        );
        given(aiPort.generateShortAnswerFeedback(
                anyString(), any(), any(), anyString(), anyString(), anyList(), anyString()
        )).willReturn(gf);

        // when
        CsQuizFeedback result = sut.generateForShortAnswer(
                CsQuizTopic.DB, CsQuizDifficulty.HIGH,
                "인덱스란 무엇인가?",
                "참조 답변", List.of("B-Tree", "해시"), "사용자 답변"
        );

        // then
        assertThat(result.getStrengths()).containsExactly("핵심 키워드 포함", "구조적 답변");
        assertThat(result.getImprovements()).containsExactly("예시 추가 필요");
        assertThat(result.getSuggestedAnswer()).isEqualTo("모범 답안입니다.");
        assertThat(result.getFollowups()).containsExactly("꼬리질문1", "꼬리질문2");
    }

    @Test
    @DisplayName("AI가 빈 리스트 반환 시 빈 피드백 정상 처리")
    void generateForMultipleChoice_빈_리스트_처리() {
        // given
        CsQuizAiPort.GeneratedFeedback gf = new CsQuizAiPort.GeneratedFeedback(
                Collections.emptyList(),
                Collections.emptyList(),
                "",
                Collections.emptyList()
        );
        given(aiPort.generateMultipleChoiceFeedback(
                anyString(), any(), any(), anyString(), anyList(), anyInt(), anyInt()
        )).willReturn(gf);

        // when
        CsQuizFeedback result = sut.generateForMultipleChoice(
                CsQuizTopic.NETWORK, CsQuizDifficulty.LOW,
                "질문", List.of("A", "B"), 0, 0
        );

        // then
        assertThat(result.getStrengths()).isEmpty();
        assertThat(result.getImprovements()).isEmpty();
        assertThat(result.getSuggestedAnswer()).isEmpty();
        assertThat(result.getFollowups()).isEmpty();
    }

    @Test
    @DisplayName("AI가 null 필드 반환 시 정상 처리")
    void generateForShortAnswer_null_필드_처리() {
        // given
        CsQuizAiPort.GeneratedFeedback gf = new CsQuizAiPort.GeneratedFeedback(
                null, null, null, null
        );
        given(aiPort.generateShortAnswerFeedback(
                anyString(), any(), any(), anyString(), anyString(), anyList(), anyString()
        )).willReturn(gf);

        // when
        CsQuizFeedback result = sut.generateForShortAnswer(
                CsQuizTopic.JAVA, CsQuizDifficulty.MID,
                "질문", "참조", List.of("키워드"), "답변"
        );

        // then
        assertThat(result.getStrengths()).isEmpty();
        assertThat(result.getImprovements()).isEmpty();
        assertThat(result.getSuggestedAnswer()).isNull();
        assertThat(result.getFollowups()).isEmpty();
    }
}
