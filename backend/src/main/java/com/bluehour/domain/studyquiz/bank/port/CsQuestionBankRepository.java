package com.bluehour.domain.studyquiz.bank.port;

import com.bluehour.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.bluehour.domain.studyquiz.session.model.CsQuizDifficulty;
import com.bluehour.domain.studyquiz.session.model.CsQuizQuestionType;
import com.bluehour.domain.studyquiz.session.model.CsQuizTopic;

import java.util.List;

public interface CsQuestionBankRepository {
    List<CsQuestionBankItem> findAllBy(CsQuizTopic topic, CsQuizDifficulty difficulty, CsQuizQuestionType type);
    int countBy(CsQuizTopic topic, CsQuizDifficulty difficulty, CsQuizQuestionType type);
    List<CsQuestionBankItem> saveAll(List<CsQuestionBankItem> items);
}

