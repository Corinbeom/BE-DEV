package com.devweb.infra.persistence.studyquiz.bank;

import com.devweb.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.devweb.domain.studyquiz.bank.port.CsQuestionBankRepository;
import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CsQuestionBankRepositoryAdapter implements CsQuestionBankRepository {

    private final SpringDataCsQuestionBankJpaRepository repo;

    public CsQuestionBankRepositoryAdapter(SpringDataCsQuestionBankJpaRepository repo) {
        this.repo = repo;
    }

    @Override
    public List<CsQuestionBankItem> findAllBy(CsQuizTopic topic, CsQuizDifficulty difficulty, CsQuizQuestionType type) {
        return repo.findAllByTopicAndDifficultyAndType(topic, difficulty, type);
    }
}

