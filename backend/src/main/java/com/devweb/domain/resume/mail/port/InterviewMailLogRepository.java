package com.devweb.domain.resume.mail.port;

import com.devweb.domain.resume.mail.model.InterviewMailLog;

import java.time.LocalDateTime;
import java.util.List;

public interface InterviewMailLogRepository {

    InterviewMailLog save(InterviewMailLog log);

    List<String> findAllQuestionsJsonByScheduleId(Long scheduleId);

    boolean existsByScheduleIdAndSentAtAfter(Long scheduleId, LocalDateTime after);
}
