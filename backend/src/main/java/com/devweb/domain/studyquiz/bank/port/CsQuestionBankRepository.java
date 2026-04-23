package com.devweb.domain.studyquiz.bank.port;

import com.devweb.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;

import java.util.List;

public interface CsQuestionBankRepository {
    List<CsQuestionBankItem> findAllBy(CsQuizTopic topic, CsQuizDifficulty difficulty, CsQuizQuestionType type);
    int countBy(CsQuizTopic topic, CsQuizDifficulty difficulty, CsQuizQuestionType type);
    List<CsQuestionBankItem> saveAll(List<CsQuestionBankItem> items);
}

