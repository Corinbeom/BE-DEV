package com.devweb.api.resume.mail;

import com.devweb.domain.resume.mail.model.InterviewMailSchedule;
import com.devweb.domain.resume.mail.port.InterviewMailLogRepository;
import com.devweb.domain.resume.mail.port.InterviewMailScheduleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Component
public class InterviewMailScheduler {

    private static final Logger log = LoggerFactory.getLogger(InterviewMailScheduler.class);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final InterviewMailScheduleRepository scheduleRepository;
    private final InterviewMailLogRepository logRepository;
    private final InterviewMailSender mailSender;

    public InterviewMailScheduler(InterviewMailScheduleRepository scheduleRepository,
                                   InterviewMailLogRepository logRepository,
                                   InterviewMailSender mailSender) {
        this.scheduleRepository = scheduleRepository;
        this.logRepository = logRepository;
        this.mailSender = mailSender;
    }

    @Scheduled(cron = "0 0 * * * *")
    public void executeHourly() {
        doExecute("@Scheduled");
    }

    public void triggerNow() {
        doExecute("HTTP-trigger");
    }

    private void doExecute(String source) {
        int currentHourKst = ZonedDateTime.now(KST).getHour();
        log.info("[메일 스케줄러] 실행 — source={}, KST={}시", source, currentHourKst);

        try {
            List<InterviewMailSchedule> schedules =
                    scheduleRepository.findAllByEnabledTrueAndSendHour(currentHourKst);

            if (schedules.isEmpty()) {
                log.info("[메일 스케줄러] KST {}시 발송 스케줄 없음", currentHourKst);
                return;
            }

            log.info("[메일 스케줄러] {}건 발송 시작", schedules.size());
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);

            for (InterviewMailSchedule schedule : schedules) {
                // 1시간 이내 이미 발송된 경우 중복 방지 (외부 트리거 + @Scheduled 동시 발화 대응)
                if (logRepository.existsByScheduleIdAndSentAtAfter(schedule.getId(), oneHourAgo)) {
                    log.info("[메일 스케줄러] 중복 방지 — 1시간 내 이미 발송됨: scheduleId={}", schedule.getId());
                    continue;
                }
                try {
                    mailSender.sendForSchedule(schedule);
                } catch (Exception e) {
                    log.error("[메일 스케줄러] 발송 실패: scheduleId={}, memberId={}",
                            schedule.getId(), schedule.getMember().getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("[메일 스케줄러] 스케줄 조회 중 오류 — source={}", source, e);
        }
    }
}
