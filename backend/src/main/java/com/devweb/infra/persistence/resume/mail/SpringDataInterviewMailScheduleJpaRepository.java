package com.devweb.infra.persistence.resume.mail;

import com.devweb.domain.resume.mail.model.InterviewMailSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SpringDataInterviewMailScheduleJpaRepository extends JpaRepository<InterviewMailSchedule, Long> {

    Optional<InterviewMailSchedule> findByMemberId(Long memberId);

    @Query("SELECT s FROM InterviewMailSchedule s " +
           "JOIN FETCH s.member " +
           "WHERE s.enabled = true AND s.sendHour = :sendHour")
    List<InterviewMailSchedule> findAllByEnabledTrueAndSendHour(@Param("sendHour") int sendHour);
}
