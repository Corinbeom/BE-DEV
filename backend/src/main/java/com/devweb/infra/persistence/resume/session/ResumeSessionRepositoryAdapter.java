package com.devweb.infra.persistence.resume.session;

import com.devweb.domain.resume.session.model.ResumeSession;
import com.devweb.domain.resume.session.port.ResumeSessionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ResumeSessionRepositoryAdapter implements ResumeSessionRepository {

    private final SpringDataResumeSessionJpaRepository repo;

    public ResumeSessionRepositoryAdapter(SpringDataResumeSessionJpaRepository repo) {
        this.repo = repo;
    }

    @Override
    public ResumeSession save(ResumeSession session) {
        return repo.save(session);
    }

    @Override
    public Optional<ResumeSession> findById(Long id) {
        return repo.findById(id);
    }

    @Override
    public List<ResumeSession> findAllByMemberId(Long memberId) {
        return repo.findAllByMemberIdOrderByCreatedAtDesc(memberId);
    }
}

