package com.devweb.infra.persistence.studyquiz.bank;

import com.devweb.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.devweb.domain.studyquiz.bank.port.CsQuestionBankRepository;
import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CsQuestionBankRepositoryAdapter implements CsQuestionBankRepository {

    private final SpringDataCsQuestionBankJpaRepository repo;

    public CsQuestionBankRepositoryAdapter(SpringDataCsQuestionBankJpaRepository repo) {
        this.repo = repo;
    }

    @Cacheable(value = "questionBank", key = "#topic.name() + ':' + #difficulty.name() + ':' + #type.name()")
    @Override
    public List<CsQuestionBankItem> findAllBy(CsQuizTopic topic, CsQuizDifficulty difficulty, CsQuizQuestionType type) {
        return repo.findAllByTopicAndDifficultyAndType(topic, difficulty, type);
    }

    @Override
    public int countBy(CsQuizTopic topic, CsQuizDifficulty difficulty, CsQuizQuestionType type) {
        return repo.countByTopicAndDifficultyAndType(topic, difficulty, type);
    }

    @CacheEvict(value = "questionBank", allEntries = true)
    @Override
    public List<CsQuestionBankItem> saveAll(List<CsQuestionBankItem> items) {
        return repo.saveAll(items);
    }
}

