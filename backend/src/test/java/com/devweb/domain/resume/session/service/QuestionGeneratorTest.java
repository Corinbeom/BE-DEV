package com.devweb.domain.resume.session.service;

import com.devweb.domain.resume.session.model.PositionType;
import com.devweb.domain.resume.session.model.ResumeQuestion;
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
class QuestionGeneratorTest {

    @Mock InterviewAiPort aiPort;
    @Mock PositionPromptStrategies promptStrategies;

    @InjectMocks QuestionGenerator sut;

    @Test
    @DisplayName("AI 응답 → ResumeQuestion 리스트 변환")
    void generate_정상_변환() {
        // given
        given(promptStrategies.systemInstructionFor(PositionType.BE)).willReturn("백엔드 시스템 프롬프트");

        InterviewAiPort.GeneratedQuestion gq1 = new InterviewAiPort.GeneratedQuestion(
                "자기소개", 90, "자기소개를 해주세요.", "배경 파악", "경험, 기술스택", "간결하게 답변"
        );
        InterviewAiPort.GeneratedQuestion gq2 = new InterviewAiPort.GeneratedQuestion(
                "기술질문", 80, "Spring 동작 원리를 설명해주세요.", "기술 역량", "IoC, DI", "IoC 컨테이너 기반 설명"
        );
        given(aiPort.generateQuestions(anyString(), anyString(), any(), any(), anyList()))
                .willReturn(List.of(gq1, gq2));

        // when
        List<ResumeQuestion> result = sut.generate(PositionType.BE, "이력서 텍스트", "포트폴리오 텍스트", "https://github.com/user", List.of());

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getOrderIndex()).isEqualTo(0);
        assertThat(result.get(0).getBadge()).isEqualTo("자기소개");
        assertThat(result.get(0).getLikelihood()).isEqualTo(90);
        assertThat(result.get(0).getInterviewQuestion().getQuestion()).isEqualTo("자기소개를 해주세요.");
        assertThat(result.get(1).getOrderIndex()).isEqualTo(1);
        assertThat(result.get(1).getBadge()).isEqualTo("기술질문");
    }

    @Test
    @DisplayName("8000자 초과 텍스트 트리밍 확인")
    void generate_트리밍() {
        // given
        given(promptStrategies.systemInstructionFor(PositionType.FE)).willReturn("프론트엔드 프롬프트");

        String longText = "A".repeat(10_000);
        given(aiPort.generateQuestions(anyString(), anyString(), any(), any(), anyList()))
                .willReturn(List.of(new InterviewAiPort.GeneratedQuestion(
                        "질문", 70, "질문입니다.", "의도", "키워드", "모범답안"
                )));

        // when
        List<ResumeQuestion> result = sut.generate(PositionType.FE, longText, null, null, List.of());

        // then
        assertThat(result).hasSize(1);
        // AI에게 전달되는 텍스트가 트리밍된 것을 verify
        then(aiPort).should().generateQuestions(
                eq("프론트엔드 프롬프트"),
                argThat(text -> text.length() < longText.length() && text.contains("...(truncated)...")),
                isNull(),
                isNull(),
                anyList()
        );
    }

    @Test
    @DisplayName("portfolioText null → null 그대로 전달")
    void generate_portfolioText_null() {
        // given
        given(promptStrategies.systemInstructionFor(PositionType.BE)).willReturn("프롬프트");
        given(aiPort.generateQuestions(anyString(), anyString(), isNull(), isNull(), anyList()))
                .willReturn(List.of(new InterviewAiPort.GeneratedQuestion(
                        "질문", 85, "질문입니다.", "의도", "키워드", "모범답안"
                )));

        // when
        List<ResumeQuestion> result = sut.generate(PositionType.BE, "이력서 텍스트", null, null, List.of());

        // then
        assertThat(result).hasSize(1);
        then(aiPort).should().generateQuestions(anyString(), anyString(), isNull(), isNull(), anyList());
    }
}
