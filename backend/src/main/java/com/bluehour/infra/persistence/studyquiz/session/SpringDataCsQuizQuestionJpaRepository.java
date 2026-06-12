package com.bluehour.infra.persistence.studyquiz.session;

import com.bluehour.domain.studyquiz.session.model.CsQuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataCsQuizQuestionJpaRepository extends JpaRepository<CsQuizQuestion, Long> {
}

