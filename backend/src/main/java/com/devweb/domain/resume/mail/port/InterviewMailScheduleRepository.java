package com.devweb.domain.resume.mail.port;

import com.devweb.domain.resume.mail.model.InterviewMailSchedule;

import java.util.List;
import java.util.Optional;

public interface InterviewMailScheduleRepository {

    InterviewMailSchedule save(InterviewMailSchedule schedule);

    Optional<InterviewMailSchedule> findByMemberId(Long memberId);

    List<InterviewMailSchedule> findAllByEnabledTrueAndSendHour(int sendHour);

    void delete(InterviewMailSchedule schedule);
}
