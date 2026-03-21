package com.devweb.infra.persistence.studyquiz.session;

import com.devweb.domain.studyquiz.session.model.CsQuizSession;
import com.devweb.domain.studyquiz.session.port.CsQuizSessionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class CsQuizSessionRepositoryAdapter implements CsQuizSessionRepository {

    private final SpringDataCsQuizSessionJpaRepository repo;

    public CsQuizSessionRepositoryAdapter(SpringDataCsQuizSessionJpaRepository repo) {
        this.repo = repo;
    }

    @Override
    public CsQuizSession save(CsQuizSession session) {
        return repo.save(session);
    }

    @Override
    public Optional<CsQuizSession> findById(Long id) {
        return repo.findById(id);
    }

    @Override
    public List<CsQuizSession> findAllByMemberId(Long memberId) {
        return repo.findAllByMemberIdOrderByCreatedAtDesc(memberId);
    }

    @Override
    public void deleteById(Long id) {
        repo.deleteById(id);
    }
}

