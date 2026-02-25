package com.devweb.infra.persistence.studyquiz.session;

import com.devweb.domain.studyquiz.session.model.CsQuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataCsQuizQuestionJpaRepository extends JpaRepository<CsQuizQuestion, Long> {
}

