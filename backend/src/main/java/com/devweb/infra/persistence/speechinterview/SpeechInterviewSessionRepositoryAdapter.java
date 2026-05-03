package com.devweb.infra.persistence.speechinterview;

import com.devweb.domain.speechinterview.model.SpeechInterviewSession;
import com.devweb.domain.speechinterview.port.SpeechInterviewSessionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class SpeechInterviewSessionRepositoryAdapter implements SpeechInterviewSessionRepository {

    private final SpringDataSpeechInterviewSessionRepository repo;

    public SpeechInterviewSessionRepositoryAdapter(SpringDataSpeechInterviewSessionRepository repo) {
        this.repo = repo;
    }

    @Override
    public SpeechInterviewSession save(SpeechInterviewSession session) {
        return repo.save(session);
    }

    @Override
    public Optional<SpeechInterviewSession> findById(Long id) {
        return repo.findWithQuestionsById(id);
    }

    @Override
    public List<SpeechInterviewSession> findByMemberIdOrderByCreatedAtDesc(Long memberId) {
        return repo.findAllByMemberIdOrderByCreatedAtDesc(memberId);
    }
}
