package com.devweb.infra.persistence.studyquiz.bank;

import com.devweb.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataCsQuestionBankJpaRepository extends JpaRepository<CsQuestionBankItem, Long> {
    List<CsQuestionBankItem> findAllByTopicAndDifficultyAndType(CsQuizTopic topic, CsQuizDifficulty difficulty, CsQuizQuestionType type);
    int countByTopicAndDifficultyAndType(CsQuizTopic topic, CsQuizDifficulty difficulty, CsQuizQuestionType type);
}

