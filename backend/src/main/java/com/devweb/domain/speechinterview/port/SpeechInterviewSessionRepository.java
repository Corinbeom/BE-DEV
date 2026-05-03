package com.devweb.domain.speechinterview.port;

import com.devweb.domain.speechinterview.model.SpeechInterviewSession;

import java.util.List;
import java.util.Optional;

public interface SpeechInterviewSessionRepository {

    SpeechInterviewSession save(SpeechInterviewSession session);

    Optional<SpeechInterviewSession> findById(Long id);

    List<SpeechInterviewSession> findByMemberIdOrderByCreatedAtDesc(Long memberId);
}
