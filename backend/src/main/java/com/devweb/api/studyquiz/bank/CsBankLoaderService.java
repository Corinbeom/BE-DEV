package com.devweb.api.studyquiz.bank;

import com.devweb.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.devweb.domain.studyquiz.bank.port.CsQuestionBankRepository;
import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CsBankLoaderService {

    private static final Logger log = LoggerFactory.getLogger(CsBankLoaderService.class);
    private static final int TARGET_PER_COMBO = 10;
    private static final String SEED_FILE = "cs-bank-seed.json";

    private final CsQuestionBankRepository bankRepository;
    private final ObjectMapper objectMapper;

    public CsBankLoaderService(CsQuestionBankRepository bankRepository, ObjectMapper objectMapper) {
        this.bankRepository = bankRepository;
        this.objectMapper = objectMapper;
    }

    public record LoadResult(int inserted, int skipped) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record SeedQuestion(
            String topic,
            String difficulty,
            String type,
            String prompt,
            List<String> choices,
            Integer correctChoiceIndex,
            String referenceAnswer,
            List<String> rubricKeywords
    ) {}

    public LoadResult load() throws IOException {
        ClassPathResource resource = new ClassPathResource(SEED_FILE);
        if (!resource.exists()) {
            throw new IllegalStateException(SEED_FILE + " 파일을 classpath에서 찾을 수 없습니다.");
        }

        List<SeedQuestion> seeds;
        try (InputStream is = resource.getInputStream()) {
            seeds = objectMapper.readValue(is,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, SeedQuestion.class));
        }
        log.info("[BankLoader] 시드 파일 로드 완료 — 총 {}개", seeds.size());

        // topic:difficulty:type 조합별 그룹핑
        Map<String, List<SeedQuestion>> byCombo = new LinkedHashMap<>();
        for (SeedQuestion s : seeds) {
            String key = s.topic() + ":" + s.difficulty() + ":" + s.type();
            byCombo.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }

        int inserted = 0;
        int skipped = 0;

        for (Map.Entry<String, List<SeedQuestion>> entry : byCombo.entrySet()) {
            String[] parts = entry.getKey().split(":");
            CsQuizTopic topic;
            CsQuizDifficulty difficulty;
            CsQuizQuestionType type;
            try {
                topic = CsQuizTopic.valueOf(parts[0]);
                difficulty = CsQuizDifficulty.valueOf(parts[1]);
                type = CsQuizQuestionType.valueOf(parts[2]);
            } catch (IllegalArgumentException e) {
                log.warn("[BankLoader] 알 수 없는 enum 값 — combo={}: {}", entry.getKey(), e.getMessage());
                skipped += entry.getValue().size();
                continue;
            }

            int have = bankRepository.countBy(topic, difficulty, type);
            int needed = Math.max(0, TARGET_PER_COMBO - have);

            if (needed == 0) {
                log.info("[BankLoader] skip — {}/{}/{} (이미 {}개)", topic, difficulty, type, have);
                skipped += entry.getValue().size();
                continue;
            }

            List<SeedQuestion> toInsert = entry.getValue().subList(0, Math.min(needed, entry.getValue().size()));
            List<CsQuestionBankItem> items = new ArrayList<>();

            for (SeedQuestion s : toInsert) {
                try {
                    if (type == CsQuizQuestionType.MULTIPLE_CHOICE) {
                        if (s.choices() == null || s.choices().size() < 2) {
                            log.warn("[BankLoader] choices 부족 — prompt={}", s.prompt());
                            continue;
                        }
                        items.add(CsQuestionBankItem.multipleChoice(
                                topic, difficulty, s.prompt(), s.choices(),
                                s.correctChoiceIndex() == null ? 0 : s.correctChoiceIndex(),
                                s.referenceAnswer()
                        ));
                    } else {
                        items.add(CsQuestionBankItem.shortAnswer(
                                topic, difficulty, s.prompt(),
                                s.rubricKeywords(), s.referenceAnswer()
                        ));
                    }
                } catch (Exception e) {
                    log.warn("[BankLoader] 문제 변환 실패 — prompt={}: {}", s.prompt(), e.getMessage());
                }
            }

            if (!items.isEmpty()) {
                bankRepository.saveAll(items);
                log.info("[BankLoader] 저장 완료 — {}/{}/{} {}개", topic, difficulty, type, items.size());
                inserted += items.size();
            }
            skipped += entry.getValue().size() - toInsert.size();
        }

        log.info("[BankLoader] 완료 — 삽입={}, 스킵={}", inserted, skipped);
        return new LoadResult(inserted, skipped);
    }
}
