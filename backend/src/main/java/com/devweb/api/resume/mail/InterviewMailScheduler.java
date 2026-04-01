package com.devweb.api.resume.mail;

import com.devweb.domain.resume.mail.model.InterviewMailSchedule;
import com.devweb.domain.resume.mail.port.InterviewMailScheduleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Component
public class InterviewMailScheduler {

    private static final Logger log = LoggerFactory.getLogger(InterviewMailScheduler.class);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final InterviewMailScheduleRepository scheduleRepository;
    private final InterviewMailSender mailSender;

    public InterviewMailScheduler(InterviewMailScheduleRepository scheduleRepository,
                                   InterviewMailSender mailSender) {
        this.scheduleRepository = scheduleRepository;
        this.mailSender = mailSender;
    }

    @Scheduled(cron = "0 0 * * * *")
    public void executeHourly() {
        int currentHourKst = ZonedDateTime.now(KST).getHour();
        List<InterviewMailSchedule> schedules = scheduleRepository.findAllByEnabledTrueAndSendHour(currentHourKst);

        if (schedules.isEmpty()) {
            log.debug("현재 시간(KST {}시)에 발송할 스케줄이 없습니다.", currentHourKst);
            return;
        }

        log.info("면접 질문 메일 스케줄 실행: KST {}시, {}건", currentHourKst, schedules.size());

        for (InterviewMailSchedule schedule : schedules) {
            try {
                mailSender.sendForSchedule(schedule);
            } catch (Exception e) {
                log.error("면접 질문 메일 발송 실패: scheduleId={}, memberId={}",
                        schedule.getId(), schedule.getMember().getId(), e);
            }
        }
    }
}
