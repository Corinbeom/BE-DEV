package com.devweb.api.studyquiz.session;

import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.devweb.domain.studyquiz.bank.port.CsQuestionBankRepository;
import com.devweb.domain.studyquiz.session.model.*;
import com.devweb.domain.studyquiz.session.port.CsQuizAiPort;
import com.devweb.domain.studyquiz.session.port.CsQuizSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class CsQuizSessionService {

    private final CsQuizSessionRepository sessionRepository;
    private final CsQuestionBankRepository bankRepository;
    private final MemberRepository memberRepository;
    private final CsQuizAiPort aiPort;

    public CsQuizSessionService(
            CsQuizSessionRepository sessionRepository,
            CsQuestionBankRepository bankRepository,
            MemberRepository memberRepository,
            CsQuizAiPort aiPort
    ) {
        this.sessionRepository = sessionRepository;
        this.bankRepository = bankRepository;
        this.memberRepository = memberRepository;
        this.aiPort = aiPort;
    }

    public CsQuizSession create(Long memberId, String difficultyRaw, List<String> topicsRaw, Integer questionCount, String title) {
        if (memberId == null) throw new IllegalArgumentException("memberId는 필수입니다.");
        if (topicsRaw == null || topicsRaw.isEmpty()) throw new IllegalArgumentException("topics는 1개 이상 필요합니다.");

        int count = (questionCount == null) ? 10 : questionCount;
        if (count < 5 || count > 10) throw new IllegalArgumentException("questionCount는 5~10 입니다.");

        CsQuizDifficulty difficulty = CsQuizDifficulty.from(difficultyRaw);
        Set<CsQuizTopic> topics = new LinkedHashSet<>();
        for (String t : topicsRaw) topics.add(CsQuizTopic.from(t));

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member를 찾을 수 없습니다. id=" + memberId));

        int mcqCount = Math.max(1, (int) Math.floor(count * 0.6));
        int shortCount = count - mcqCount;
        if (shortCount <= 0) shortCount = 1;
        if (mcqCount + shortCount != count) mcqCount = count - shortCount;

        String resolvedTitle = (title == null || title.isBlank())
                ? "CS Quiz (" + difficulty.name() + ")"
                : title;

        CsQuizSession session = new CsQuizSession(member, resolvedTitle, difficulty, topics);

        List<CsQuizQuestion> questions = new ArrayList<>();
        questions.addAll(pickMultipleChoiceQuestionsWithFallback(topics, difficulty, mcqCount, 0));
        questions.addAll(pickShortAnswerQuestionsWithFallback(topics, difficulty, shortCount, questions.size()));

        session.markQuestionsReady(questions);
        return sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public CsQuizSession get(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CsQuizSession을 찾을 수 없습니다. id=" + id));
    }

    private List<CsQuizQuestion> pickMultipleChoiceQuestionsWithFallback(Set<CsQuizTopic> topics, CsQuizDifficulty difficulty, int count, int startIndex) {
        List<CsQuestionBankItem> pool = new ArrayList<>();
        for (CsQuizTopic t : topics) {
            pool.addAll(bankRepository.findAllBy(t, difficulty, CsQuizQuestionType.MULTIPLE_CHOICE));
        }
        Collections.shuffle(pool);

        List<CsQuizQuestion> out = new ArrayList<>();
        int fromBank = Math.min(count, pool.size());
        for (int i = 0; i < fromBank; i++) {
            CsQuestionBankItem item = pool.get(i);
            out.add(CsQuizQuestion.multipleChoice(
                    startIndex + i,
                    item.getTopic(),
                    item.getDifficulty(),
                    item.getPrompt(),
                    item.getChoices(),
                    item.getCorrectChoiceIndex() == null ? 0 : item.getCorrectChoiceIndex(),
                    item.getReferenceAnswer()
            ));
        }
        int remaining = count - fromBank;
        if (remaining > 0) {
            List<CsQuizAiPort.GeneratedQuizQuestion> generated = aiPort.generateQuestions(
                    questionGenSystemInstruction(),
                    topics,
                    difficulty,
                    remaining,
                    0
            );
            int idx = out.size();
            for (CsQuizAiPort.GeneratedQuizQuestion g : generated) {
                if (g.type() != CsQuizQuestionType.MULTIPLE_CHOICE) continue;
                out.add(CsQuizQuestion.multipleChoice(
                        startIndex + idx++,
                        g.topic() == null ? topics.iterator().next() : g.topic(),
                        difficulty,
                        g.prompt(),
                        g.choices() == null ? List.of() : g.choices(),
                        g.correctChoiceIndex() == null ? 0 : g.correctChoiceIndex(),
                        g.referenceAnswer()
                ));
            }
            if (out.size() < count) {
                throw new IllegalStateException("객관식 문제 생성이 부족합니다. need=" + count + " got=" + out.size());
            }
        }
        return out;
    }

    private List<CsQuizQuestion> pickShortAnswerQuestionsWithFallback(Set<CsQuizTopic> topics, CsQuizDifficulty difficulty, int count, int startIndex) {
        List<CsQuestionBankItem> pool = new ArrayList<>();
        for (CsQuizTopic t : topics) {
            pool.addAll(bankRepository.findAllBy(t, difficulty, CsQuizQuestionType.SHORT_ANSWER));
        }
        Collections.shuffle(pool);

        List<CsQuizQuestion> out = new ArrayList<>();
        int fromBank = Math.min(count, pool.size());
        for (int i = 0; i < fromBank; i++) {
            CsQuestionBankItem item = pool.get(i);
            out.add(CsQuizQuestion.shortAnswer(
                    startIndex + i,
                    item.getTopic(),
                    item.getDifficulty(),
                    item.getPrompt(),
                    item.getRubricKeywords(),
                    item.getReferenceAnswer()
            ));
        }
        int remaining = count - fromBank;
        if (remaining > 0) {
            List<CsQuizAiPort.GeneratedQuizQuestion> generated = aiPort.generateQuestions(
                    questionGenSystemInstruction(),
                    topics,
                    difficulty,
                    0,
                    remaining
            );
            int idx = out.size();
            for (CsQuizAiPort.GeneratedQuizQuestion g : generated) {
                if (g.type() != CsQuizQuestionType.SHORT_ANSWER) continue;
                out.add(CsQuizQuestion.shortAnswer(
                        startIndex + idx++,
                        g.topic() == null ? topics.iterator().next() : g.topic(),
                        difficulty,
                        g.prompt(),
                        g.rubricKeywords(),
                        g.referenceAnswer()
                ));
            }
            if (out.size() < count) {
                throw new IllegalStateException("주관식 문제 생성이 부족합니다. need=" + count + " got=" + out.size());
            }
        }
        return out;
    }

    private static String questionGenSystemInstruction() {
        return """
                [언어 규칙] 모든 출력은 반드시 한국어로만 작성하세요. 영어, 중국어, 일본어 등 다른 언어는 절대 사용하지 마세요.
                당신은 CS 면접 대비 문제를 생성하는 출제자입니다.
                사실/개념 오류가 없도록 보수적으로 작성하고, 질문은 명확하고 애매하지 않게 만드세요.
                출력은 반드시 지정된 JSON 스키마만 따릅니다.
                """;
    }
}

