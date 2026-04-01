package com.devweb.infra.persistence.resume.mail;

import com.devweb.domain.resume.mail.model.InterviewMailLog;
import com.devweb.domain.resume.mail.port.InterviewMailLogRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class InterviewMailLogRepositoryAdapter implements InterviewMailLogRepository {

    private final SpringDataInterviewMailLogJpaRepository jpaRepository;

    public InterviewMailLogRepositoryAdapter(SpringDataInterviewMailLogJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public InterviewMailLog save(InterviewMailLog log) {
        return jpaRepository.save(log);
    }

    @Override
    public List<String> findAllQuestionsJsonByScheduleId(Long scheduleId) {
        return jpaRepository.findAllQuestionsJsonByScheduleId(scheduleId);
    }
}
