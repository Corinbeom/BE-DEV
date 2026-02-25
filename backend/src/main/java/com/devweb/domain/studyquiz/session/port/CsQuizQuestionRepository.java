package com.devweb.domain.studyquiz.session.port;

import com.devweb.domain.studyquiz.session.model.CsQuizQuestion;

import java.util.Optional;

public interface CsQuizQuestionRepository {
    CsQuizQuestion save(CsQuizQuestion question);

    Optional<CsQuizQuestion> findById(Long id);
}

