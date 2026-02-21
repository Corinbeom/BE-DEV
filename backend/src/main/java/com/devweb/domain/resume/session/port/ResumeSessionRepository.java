package com.devweb.domain.resume.session.port;

import com.devweb.domain.resume.session.model.ResumeSession;

import java.util.List;
import java.util.Optional;

public interface ResumeSessionRepository {
    ResumeSession save(ResumeSession session);

    Optional<ResumeSession> findById(Long id);

    List<ResumeSession> findAllByMemberId(Long memberId);
}

