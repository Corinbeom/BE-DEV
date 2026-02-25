package com.devweb.infra.persistence.studyquiz.session;

import com.devweb.domain.studyquiz.session.model.CsQuizSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataCsQuizSessionJpaRepository extends JpaRepository<CsQuizSession, Long> {
    List<CsQuizSession> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);
}

