package com.bluehour.domain.resume.mail.port;

import com.bluehour.domain.resume.mail.model.InterviewMailLog;

import java.time.LocalDateTime;
import java.util.List;

public interface InterviewMailLogRepository {

    InterviewMailLog save(InterviewMailLog log);

    List<String> findAllQuestionsJsonByScheduleId(Long scheduleId);

    boolean existsByScheduleIdAndSentAtAfter(Long scheduleId, LocalDateTime after);
}
