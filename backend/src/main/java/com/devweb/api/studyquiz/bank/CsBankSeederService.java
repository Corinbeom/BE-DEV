package com.devweb.api.studyquiz.bank;

import com.devweb.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.devweb.domain.studyquiz.bank.port.CsQuestionBankRepository;
import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import com.devweb.domain.studyquiz.session.port.CsQuizAiPort;
import com.devweb.infra.ai.AiTextSanitizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class CsBankSeederService {

    private static final Logger log = LoggerFactory.getLogger(CsBankSeederService.class);
    private static final int TARGET_PER_COMBO = 10;

    private final CsQuestionBankRepository bankRepository;
    private final CsQuizAiPort aiPort;

    public CsBankSeederService(CsQuestionBankRepository bankRepository, CsQuizAiPort aiPort) {
        this.bankRepository = bankRepository;
        this.aiPort = aiPort;
    }

    public record SeedResult(int generated, int skipped, int failed) {}

    // @Async: HTTP 요청은 즉시 202 반환, 시딩은 백그라운드 실행
    // @Transactional 없음 — 각 saveAll이 자체 트랜잭션, AI 호출 중 DB 커넥션 점유 방지
    @Async
    public void seed() {
        int generated = 0;
        int skipped = 0;
        int failed = 0;

        for (CsQuizTopic topic : CsQuizTopic.values()) {
            for (CsQuizDifficulty difficulty : CsQuizDifficulty.values()) {
                int mcqHave = bankRepository.countBy(topic, difficulty, CsQuizQuestionType.MULTIPLE_CHOICE);
                int saHave = bankRepository.countBy(topic, difficulty, CsQuizQuestionType.SHORT_ANSWER);
                int mcqNeeded = Math.max(0, TARGET_PER_COMBO - mcqHave);
                int saNeeded = Math.max(0, TARGET_PER_COMBO - saHave);

                if (mcqNeeded == 0 && saNeeded == 0) {
                    log.info("[BankSeeder] skip — {}/{} MCQ={} SA={} (이미 충분)", topic, difficulty, mcqHave, saHave);
                    skipped++;
                    continue;
                }

                log.info("[BankSeeder] 생성 시작 — {}/{} MCQ+{}개 SA+{}개", topic, difficulty, mcqNeeded, saNeeded);
                try {
                    List<CsQuizAiPort.GeneratedQuizQuestion> aiResults = aiPort.generateQuestions(
                            systemInstruction(), Set.of(topic), difficulty, mcqNeeded, saNeeded
                    );

                    List<CsQuestionBankItem> items = new ArrayList<>();
                    for (CsQuizAiPort.GeneratedQuizQuestion g : aiResults) {
                        CsQuizTopic resolvedTopic = g.topic() != null ? g.topic() : topic;
                        if (g.type() == CsQuizQuestionType.MULTIPLE_CHOICE && g.choices() != null && !g.choices().isEmpty()) {
                            items.add(CsQuestionBankItem.multipleChoice(
                                    resolvedTopic,
                                    difficulty,
                                    AiTextSanitizer.sanitize(g.prompt()),
                                    AiTextSanitizer.sanitizeList(g.choices()),
                                    g.correctChoiceIndex() == null ? 0 : g.correctChoiceIndex(),
                                    AiTextSanitizer.sanitize(g.referenceAnswer())
                            ));
                        } else if (g.type() == CsQuizQuestionType.SHORT_ANSWER) {
                            items.add(CsQuestionBankItem.shortAnswer(
                                    resolvedTopic,
                                    difficulty,
                                    AiTextSanitizer.sanitize(g.prompt()),
                                    AiTextSanitizer.sanitizeList(g.rubricKeywords()),
                                    AiTextSanitizer.sanitize(g.referenceAnswer())
                            ));
                        }
                    }

                    bankRepository.saveAll(items);
                    log.info("[BankSeeder] 저장 완료 — {}/{} {}개", topic, difficulty, items.size());
                    generated += items.size();

                } catch (Exception e) {
                    log.error("[BankSeeder] AI 생성 실패 — {}/{}: {}", topic, difficulty, e.getMessage());
                    failed++;
                }

                // Groq 12,000 TPM 제한 방어: 조합 사이 15초 대기 (콤보당 ~9,000 토큰 소모)
                try { Thread.sleep(15_000); } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    log.warn("[BankSeeder] 인터럽트 — 중단");
                    break;
                }
            }
        }

        log.info("[BankSeeder] 완료 — 생성={}, 스킵={}, 실패={}", generated, skipped, failed);
    }

    private static String systemInstruction() {
        return """
                [언어 규칙] 모든 출력은 반드시 한국어로만 작성하세요. 영어, 중국어 등 다른 언어는 사용하지 마세요.
                당신은 CS 면접 대비 문제를 생성하는 출제자입니다.
                사실/개념 오류가 없도록 보수적으로 작성하고, 질문은 명확하고 애매하지 않게 만드세요.
                출력은 반드시 지정된 JSON 스키마만 따릅니다.
                """;
    }
}
