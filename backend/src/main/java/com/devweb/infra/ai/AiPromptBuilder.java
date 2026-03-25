package com.devweb.infra.ai;

import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;

import java.util.List;
import java.util.Set;

/**
 * 모든 AI 어댑터가 공유하는 프롬프트 빌더.
 * 프롬프트 변경 시 이 파일만 수정하면 Gemini/Groq 등 모든 어댑터에 반영된다.
 */
public final class AiPromptBuilder {

    private static final int QUESTIONS_TARGET = 5;

    private AiPromptBuilder() {}

    public static String buildQuestionsPrompt(String resumeText, String portfolioText, String portfolioUrl, List<String> targetTechnologies) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
                아래 입력을 기반으로 실제 면접에서 나올 법한 질문 %d개를 만들어 주세요.

                출력은 반드시 아래 JSON 스키마를 정확히 따르세요:
                {
                  "questions": [
                    {
                      "badge": "질문 분류",
                      "likelihood": 80,
                      "question": "질문 본문",
                      "intention": "출제 의도",
                      "keywords": "키워드1, 키워드2",
                      "modelAnswer": "모범 답안"
                    }
                  ]
                }

                각 필드 설명:
                - badge: 질문 분류(예: 프로젝트 기반, 기술적 난관, 협업/행동, 기술 스택, 아키텍처, 성능/최적화, 운영/장애대응, 채용공고 기술)
                - likelihood: 출제 확률(0~100 정수)
                - question: 질문 본문
                - intention: 출제 의도(한두 문장)
                - keywords: 핵심 키워드(쉼표 구분)
                - modelAnswer: 모범 답안(3~7문장)

                규칙:
                - 과장/추측 금지. 제공된 텍스트에서만 근거를 잡아주세요.
                - 질문은 가능한 한 구체적으로(프로젝트/기술/의사결정/성과 검증).
                - [PortfolioText]나 [PortfolioUrl]이 제공된 경우, 포트폴리오 내용에서도 반드시 질문을 생성하세요.
                  - 이력서만 있으면: 이력서 기반 질문 %d개.
                  - 이력서 + 포트폴리오 모두 있으면: 이력서 기반 최소 2개 + 포트폴리오 기반 최소 2개, 나머지는 양쪽을 교차하여 구성.
                  - 포트폴리오 기반 질문의 badge에는 '포트폴리오 기반'을 포함해 주세요.
                - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
                - 모든 문자열 값에는 줄바꿈을 넣지 마세요(필요하면 \\n 으로 escape).
                - 모든 문자열 값 안에는 큰따옴표(") 문자를 넣지 마세요(필요하면 괄호나 작은따옴표로 표현).
                - 길이 제한을 지켜주세요:
                  - question: 250자 이내
                  - intention: 350자 이내
                  - keywords: 200자 이내
                  - modelAnswer: 500자 이내(단락 1개)
                """.formatted(QUESTIONS_TARGET, QUESTIONS_TARGET));

        if (targetTechnologies != null && !targetTechnologies.isEmpty()) {
            String techsCsv = String.join(", ", targetTechnologies);
            sb.append("""

                [TargetTechnologies]
                %s

                - 위 기술 스택은 지원 대상 회사의 채용공고에 명시된 요구 기술입니다.
                - 이력서/포트폴리오에서 해당 기술 관련 경험이 있으면, 그 경험을 깊이 파고드는 질문을 우선 생성하세요.
                - 해당 기술 경험이 없더라도, 지원자의 유사 경험과 연결하여 '이 기술을 어떻게 학습/적용할 것인지' 묻는 질문을 1개 이상 포함하세요.
                - 채용공고 기술 관련 질문의 badge에는 '채용공고 기술'을 포함해 주세요.
                """.formatted(techsCsv));
        }

        sb.append("""

                [ResumeText]
                %s

                [PortfolioText]
                %s

                [PortfolioUrl]
                %s
                """.formatted(
                nullToEmpty(resumeText),
                nullToEmpty(portfolioText),
                nullToEmpty(portfolioUrl)
        ));

        return sb.toString();
    }

    public static String buildFeedbackPrompt(String question, String intention, String keywords, String modelAnswer, String answerText) {
        return """
                다음 질문과 사용자 답변을 평가해 주세요.
                출력은 반드시 아래 JSON 스키마를 정확히 따르세요:
                {"strengths":["잘한 점"],"improvements":["개선할 점"],"suggestedAnswer":"개선 예시 답변","followups":["꼬리질문"]}

                각 필드:
                - strengths: 잘한 점(2~5개, 배열)
                - improvements: 개선할 점(2~5개, 배열)
                - suggestedAnswer: 개선 예시 답변(한 단락, 문자열)
                - followups: 추가 꼬리질문(1~3개, 배열)

                기준:
                - 정확성/구체성/근거/깊이/커뮤니케이션을 종합적으로 봅니다.
                - 답변이 모호하면 어떤 정보를 추가해야 하는지 구체적으로 제시합니다.
                - 모든 문자열 값에는 줄바꿈을 넣지 마세요(필요하면 \\n 으로 escape).
                - suggestedAnswer는 900자 이내로 작성하세요.

                [Question]
                %s

                [Intention]
                %s

                [Keywords]
                %s

                [ModelAnswer]
                %s

                [UserAnswer]
                %s
                """.formatted(
                nullToEmpty(question),
                nullToEmpty(intention),
                nullToEmpty(keywords),
                nullToEmpty(modelAnswer),
                nullToEmpty(answerText)
        );
    }

    public static String buildCsQuizQuestionsPrompt(Set<CsQuizTopic> topics, CsQuizDifficulty difficulty, CsQuizQuestionType type, int count) {
        String topicsCsv = topics.stream().map(Enum::name).sorted().reduce((a, b) -> a + ", " + b).orElse("");
        return """
                아래 조건을 만족하는 CS 퀴즈 문제를 정확히 %d개 생성하세요.
                난이도는 모두 %s, 토픽은 다음 목록 중에서만 선택하세요: %s
                문제 유형은 모두 %s 입니다.

                출력은 반드시 JSON으로만, 아래 스키마를 지키세요:
                {
                  "questions": [
                    {
                      "topic": "OS|NETWORK|DB|SPRING|JAVA|DATA_STRUCTURE|ALGORITHM|ARCHITECTURE|CLOUD",
                      "difficulty": "LOW|MID|HIGH",
                      "type": "MULTIPLE_CHOICE|SHORT_ANSWER",
                      "prompt": "문제 본문",
                      "choices": ["보기1", "보기2", "보기3", "보기4"],
                      "correctChoiceIndex": 0,
                      "referenceAnswer": "정답/해설(짧게)",
                      "rubricKeywords": ["키워드1","키워드2"]
                    }
                  ]
                }

                규칙:
                - JSON은 한 줄(minified)로만 출력하세요. 설명 텍스트 금지.
                - 문자열 값에 줄바꿈 금지(필요하면 \\n).
                - 문자열 값 안에 큰따옴표(") 넣지 마세요.
                - topic/difficulty/type은 반드시 조건과 일치해야 합니다.
                - prompt는 220자 이내로 작성하세요.
                - MULTIPLE_CHOICE:
                  - choices는 반드시 4개
                  - correctChoiceIndex는 0~3
                  - referenceAnswer는 350자 이내
                  - rubricKeywords는 빈 배열로
                - SHORT_ANSWER:
                  - choices는 빈 배열
                  - correctChoiceIndex는 -1
                  - referenceAnswer는 550자 이내
                  - rubricKeywords는 3~6개
                """.formatted(count, difficulty.name(), topicsCsv, type.name());
    }

    public static String buildCsMultipleChoiceFeedbackPrompt(
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            String question,
            List<String> choices,
            int correctChoiceIndex,
            int selectedChoiceIndex
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
                다음 객관식 문제에 대해, 사용자의 선택이 왜 맞/틀렸는지 설명하고 피드백을 제공하세요.
                출력은 반드시 JSON으로만, 아래 필드를 포함하세요:
                - strengths: 잘한 점(0~3개)
                - improvements: 개선할 점(0~3개)
                - suggestedAnswer: 정답/해설(한 단락, 500자 이내)
                - followups: 추가 꼬리질문(0~2개)

                제약:
                - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
                - 모든 문자열 값에는 줄바꿈 금지(필요하면 \\n).
                - 문자열 값 안에는 큰따옴표(")를 넣지 마세요.

                [Topic] %s
                [Difficulty] %s
                [Question] %s
                [Choices]
                """.formatted(topic.name(), difficulty.name(), nullToEmpty(question)));
        for (int i = 0; i < choices.size(); i++) {
            sb.append(i).append(". ").append(choices.get(i)).append("\n");
        }
        sb.append("[CorrectChoiceIndex] ").append(correctChoiceIndex).append("\n");
        sb.append("[SelectedChoiceIndex] ").append(selectedChoiceIndex).append("\n");
        return sb.toString();
    }

    public static String buildCsShortAnswerFeedbackPrompt(
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            String question,
            String referenceAnswer,
            List<String> rubricKeywords,
            String userAnswer
    ) {
        String keywords = (rubricKeywords == null || rubricKeywords.isEmpty()) ? "" : String.join(", ", rubricKeywords);
        return """
                다음 주관식 문제에 대해 사용자의 답변을 정성 평가하고 피드백을 제공하세요.
                출력은 반드시 JSON으로만, 아래 필드를 포함하세요:
                - strengths: 잘한 점(0~5개)
                - improvements: 개선할 점(0~5개)
                - suggestedAnswer: 개선 예시 답변(한 단락, 700자 이내)
                - followups: 추가 꼬리질문(0~3개)

                제약:
                - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
                - 모든 문자열 값에는 줄바꿈 금지(필요하면 \\n).
                - 문자열 값 안에는 큰따옴표(")를 넣지 마세요.
                - 추측/날조 금지. 모르면 '부족'으로 판단하고 어떤 포인트가 필요한지 제시하세요.

                [Topic] %s
                [Difficulty] %s
                [Question] %s
                [RubricKeywords] %s
                [ReferenceAnswer] %s
                [UserAnswer] %s
                """.formatted(
                topic.name(),
                difficulty.name(),
                nullToEmpty(question),
                nullToEmpty(keywords),
                nullToEmpty(referenceAnswer),
                nullToEmpty(userAnswer)
        );
    }

    public static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
