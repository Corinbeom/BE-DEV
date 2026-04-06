package com.devweb.domain.resume.session.service;

import com.devweb.domain.resume.session.model.Feedback;
import com.devweb.domain.resume.session.port.InterviewAiPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class AnswerFeedbackGeneratorTest {

    @Mock InterviewAiPort aiPort;
    @Mock PositionPromptRegistry promptRegistry;

    @InjectMocks AnswerFeedbackGenerator sut;

    @Test
    @DisplayName("AI 피드백 → Feedback 객체 변환 확인")
    void generate_정상_변환() {
        // given
        given(promptRegistry.systemInstructionFor("BE")).willReturn("백엔드 프롬프트");

        InterviewAiPort.GeneratedFeedback gf = new InterviewAiPort.GeneratedFeedback(
                List.of("명확한 답변", "구체적 사례"),
                List.of("좀 더 간결하게"),
                "이상적인 답변 예시입니다.",
                List.of("그렇다면 확장성은 어떻게 고려하셨나요?")
        );
        given(aiPort.generateFeedback(anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .willReturn(gf);

        // when
        Feedback result = sut.generate(
                "BE",
                "자기소개를 해주세요.",
                "배경 파악",
                "경험, 기술스택",
                "간결하게 답변",
                "저는 3년차 백엔드 개발자입니다."
        );

        // then
        assertThat(result.getStrengths()).containsExactly("명확한 답변", "구체적 사례");
        assertThat(result.getImprovements()).containsExactly("좀 더 간결하게");
        assertThat(result.getSuggestedAnswer()).isEqualTo("이상적인 답변 예시입니다.");
        assertThat(result.getFollowups()).containsExactly("그렇다면 확장성은 어떻게 고려하셨나요?");
    }
}
