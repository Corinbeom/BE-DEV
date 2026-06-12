package com.bluehour.infra.persistence.resume.session;

import com.bluehour.domain.resume.session.model.ResumeQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataResumeQuestionJpaRepository extends JpaRepository<ResumeQuestion, Long> {
}

