package com.bluehour.infra.persistence.studyquiz.bank;

import com.bluehour.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.bluehour.domain.studyquiz.session.model.CsQuizDifficulty;
import com.bluehour.domain.studyquiz.session.model.CsQuizQuestionType;
import com.bluehour.domain.studyquiz.session.model.CsQuizTopic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataCsQuestionBankJpaRepository extends JpaRepository<CsQuestionBankItem, Long> {
    List<CsQuestionBankItem> findAllByTopicAndDifficultyAndType(CsQuizTopic topic, CsQuizDifficulty difficulty, CsQuizQuestionType type);
    int countByTopicAndDifficultyAndType(CsQuizTopic topic, CsQuizDifficulty difficulty, CsQuizQuestionType type);
}

