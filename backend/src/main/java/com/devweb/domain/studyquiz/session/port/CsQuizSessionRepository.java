package com.devweb.domain.studyquiz.session.port;

import com.devweb.domain.studyquiz.session.model.CsQuizSession;

import java.util.List;
import java.util.Optional;

public interface CsQuizSessionRepository {
    CsQuizSession save(CsQuizSession session);

    Optional<CsQuizSession> findById(Long id);

    List<CsQuizSession> findAllByMemberId(Long memberId);
}

