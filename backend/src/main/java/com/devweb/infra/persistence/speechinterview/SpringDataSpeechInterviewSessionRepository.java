package com.devweb.infra.persistence.speechinterview;

import com.devweb.domain.speechinterview.model.SpeechInterviewSession;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpringDataSpeechInterviewSessionRepository extends JpaRepository<SpeechInterviewSession, Long> {

    @EntityGraph(attributePaths = {"questions", "questions.answer"})
    Optional<SpeechInterviewSession> findWithQuestionsById(Long id);

    @EntityGraph(attributePaths = {"questions"})
    List<SpeechInterviewSession> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);
}
