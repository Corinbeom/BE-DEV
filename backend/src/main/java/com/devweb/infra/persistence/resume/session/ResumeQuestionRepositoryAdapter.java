package com.devweb.infra.persistence.resume.session;

import com.devweb.domain.resume.session.model.ResumeQuestion;
import com.devweb.domain.resume.session.port.ResumeQuestionRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class ResumeQuestionRepositoryAdapter implements ResumeQuestionRepository {

    private final SpringDataResumeQuestionJpaRepository repo;

    public ResumeQuestionRepositoryAdapter(SpringDataResumeQuestionJpaRepository repo) {
        this.repo = repo;
    }

    @Override
    public ResumeQuestion save(ResumeQuestion question) {
        return repo.save(question);
    }

    @Override
    public Optional<ResumeQuestion> findById(Long id) {
        return repo.findById(id);
    }
}

