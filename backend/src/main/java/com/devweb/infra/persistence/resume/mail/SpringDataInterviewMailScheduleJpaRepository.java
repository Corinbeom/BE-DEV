package com.devweb.infra.persistence.resume.mail;

import com.devweb.domain.resume.mail.model.InterviewMailSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpringDataInterviewMailScheduleJpaRepository extends JpaRepository<InterviewMailSchedule, Long> {

    Optional<InterviewMailSchedule> findByMemberId(Long memberId);

    List<InterviewMailSchedule> findAllByEnabledTrueAndSendHour(int sendHour);
}
