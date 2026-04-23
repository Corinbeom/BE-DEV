package com.devweb.infra.persistence.resume.mail;

import com.devweb.domain.resume.mail.model.InterviewMailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SpringDataInterviewMailLogJpaRepository extends JpaRepository<InterviewMailLog, Long> {

    @Query("SELECT l.questionsJson FROM InterviewMailLog l WHERE l.schedule.id = :scheduleId ORDER BY l.sentAt DESC")
    List<String> findAllQuestionsJsonByScheduleId(@Param("scheduleId") Long scheduleId);

    boolean existsByScheduleIdAndSentAtAfter(Long scheduleId, LocalDateTime after);
}
