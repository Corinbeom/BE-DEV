package com.devweb.infra.persistence.resume.session;

import com.devweb.domain.resume.session.model.ResumeQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataResumeQuestionJpaRepository extends JpaRepository<ResumeQuestion, Long> {
}

