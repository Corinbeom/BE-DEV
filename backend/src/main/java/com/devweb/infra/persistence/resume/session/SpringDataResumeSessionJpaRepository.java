package com.devweb.infra.persistence.resume.session;

import com.devweb.domain.resume.session.model.ResumeSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataResumeSessionJpaRepository extends JpaRepository<ResumeSession, Long> {
    List<ResumeSession> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);
}

