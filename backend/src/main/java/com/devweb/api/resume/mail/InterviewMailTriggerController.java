package com.devweb.api.resume.mail;

import com.devweb.common.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * 외부 크론 서비스(GitHub Actions)에서 매시간 호출하는 내부 트리거 엔드포인트.
 * X-Cron-Secret 헤더로 인증. Spring @Scheduled와 독립적으로 동작하여
 * 배포/재시작으로 인한 스케줄 누락을 방지한다.
 */
@RestController
@RequestMapping("/api/internal")
public class InterviewMailTriggerController {

    private static final Logger log = LoggerFactory.getLogger(InterviewMailTriggerController.class);

    private final InterviewMailScheduler scheduler;
    private final String cronSecret;

    public InterviewMailTriggerController(
            InterviewMailScheduler scheduler,
            @Value("${devweb.cron.secret:}") String cronSecret) {
        this.scheduler = scheduler;
        this.cronSecret = cronSecret;
    }

    @PostMapping("/mail-trigger")
    public ApiResponse<Void> trigger(
            @RequestHeader(value = "X-Cron-Secret", required = false) String secret) {

        if (cronSecret.isBlank()) {
            log.warn("[mail-trigger] DEVWEB_CRON_SECRET 미설정 — 엔드포인트 비활성화");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Cron trigger not configured");
        }
        if (!cronSecret.equals(secret)) {
            log.warn("[mail-trigger] 인증 실패 — 잘못된 시크릿");
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid cron secret");
        }

        log.info("[mail-trigger] 외부 트리거 수신 — 스케줄러 실행");
        scheduler.triggerNow();
        return ApiResponse.ok();
    }
}
