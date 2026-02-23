package com.devweb.domain.resume.session.service;

import com.devweb.domain.resume.model.InterviewQuestion;
import com.devweb.domain.resume.session.model.PositionType;
import com.devweb.domain.resume.session.model.ResumeQuestion;
import com.devweb.domain.resume.session.port.InterviewAiPort;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class QuestionGenerator {

    private static final int MAX_CONTEXT_CHARS = 8_000; // 응답 지연/타임아웃 방지용 가드

    private final InterviewAiPort aiPort;
    private final PositionPromptStrategies promptStrategies;

    public QuestionGenerator(InterviewAiPort aiPort, PositionPromptStrategies promptStrategies) {
        this.aiPort = aiPort;
        this.promptStrategies = promptStrategies;
    }

    public List<ResumeQuestion> generate(PositionType positionType, String resumeText, String portfolioText, String portfolioUrl) {
        String systemInstruction = promptStrategies.systemInstructionFor(positionType);
        String safeResumeText = trimToMaxChars(resumeText, MAX_CONTEXT_CHARS);
        String safePortfolioText = trimToMaxChars(portfolioText, MAX_CONTEXT_CHARS);

        List<InterviewAiPort.GeneratedQuestion> generated =
                aiPort.generateQuestions(systemInstruction, safeResumeText, safePortfolioText, portfolioUrl);

        List<ResumeQuestion> questions = new ArrayList<>();
        int idx = 0;
        for (InterviewAiPort.GeneratedQuestion q : generated) {
            InterviewQuestion vo = new InterviewQuestion(q.question(), q.intention(), q.keywords(), q.modelAnswer());
            questions.add(new ResumeQuestion(idx++, q.badge(), q.likelihood(), vo));
        }
        return questions;
    }

    private static String trimToMaxChars(String text, int max) {
        if (text == null) return null;
        if (text.length() <= max) return text;
        // 앞/뒤를 조금씩 남겨 문맥 손실을 줄인다.
        int head = Math.max(0, (int) (max * 0.7));
        int tail = Math.max(0, max - head);
        String h = text.substring(0, Math.min(head, text.length()));
        String t = text.substring(Math.max(0, text.length() - tail));
        return h + "\n...(truncated)...\n" + t;
    }
}

