package com.devweb.domain.studyquiz.session.service;

import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizFeedback;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import com.devweb.domain.studyquiz.session.port.CsQuizAiPort;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CsQuizFeedbackGenerator {

    private final CsQuizAiPort aiPort;

    public CsQuizFeedbackGenerator(CsQuizAiPort aiPort) {
        this.aiPort = aiPort;
    }

    public CsQuizFeedback generateForMultipleChoice(
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            String question,
            List<String> choices,
            int correctChoiceIndex,
            int selectedChoiceIndex
    ) {
        CsQuizAiPort.GeneratedFeedback f = aiPort.generateMultipleChoiceFeedback(
                baseSystemInstruction(),
                topic,
                difficulty,
                question,
                choices,
                correctChoiceIndex,
                selectedChoiceIndex
        );
        return new CsQuizFeedback(f.strengths(), f.improvements(), f.suggestedAnswer(), f.followups());
    }

    public CsQuizFeedback generateForShortAnswer(
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            String question,
            String referenceAnswer,
            List<String> rubricKeywords,
            String userAnswer
    ) {
        CsQuizAiPort.GeneratedFeedback f = aiPort.generateShortAnswerFeedback(
                baseSystemInstruction(),
                topic,
                difficulty,
                question,
                referenceAnswer,
                rubricKeywords,
                userAnswer
        );
        return new CsQuizFeedback(f.strengths(), f.improvements(), f.suggestedAnswer(), f.followups());
    }

    private static String baseSystemInstruction() {
        return """
                [언어 규칙] 모든 출력은 반드시 한국어로만 작성하세요. 영어, 중국어, 일본어 등 다른 언어는 절대 사용하지 마세요.
                당신은 시니어 면접관 겸 튜터입니다.
                출력은 반드시 지정된 JSON 스키마만 따르며, 사실과 개념의 정확성을 최우선으로 합니다.
                사용자의 답변에 대해 정성 피드백을 제공합니다(잘한 점/개선점/개선 예시 답변/꼬리질문).
                """;
    }
}

