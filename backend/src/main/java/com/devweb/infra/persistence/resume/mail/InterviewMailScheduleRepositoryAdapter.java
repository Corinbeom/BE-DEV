package com.devweb.infra.persistence.resume.mail;

import com.devweb.domain.resume.mail.model.InterviewMailSchedule;
import com.devweb.domain.resume.mail.port.InterviewMailScheduleRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class InterviewMailScheduleRepositoryAdapter implements InterviewMailScheduleRepository {

    private final SpringDataInterviewMailScheduleJpaRepository jpaRepository;

    public InterviewMailScheduleRepositoryAdapter(SpringDataInterviewMailScheduleJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public InterviewMailSchedule save(InterviewMailSchedule schedule) {
        return jpaRepository.save(schedule);
    }

    @Override
    public Optional<InterviewMailSchedule> findByMemberId(Long memberId) {
        return jpaRepository.findByMemberId(memberId);
    }

    @Override
    public List<InterviewMailSchedule> findAllByEnabledTrueAndSendHour(int sendHour) {
        return jpaRepository.findAllByEnabledTrueAndSendHour(sendHour);
    }

    @Override
    public void delete(InterviewMailSchedule schedule) {
        jpaRepository.delete(schedule);
    }
}
