package com.devweb.api.studyquiz.bank;

import com.devweb.common.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/cs-bank")
public class CsBankSeederController {

    private static final Logger log = LoggerFactory.getLogger(CsBankSeederController.class);

    private final CsBankSeederService seederService;
    private final String cronSecret;

    public CsBankSeederController(
            CsBankSeederService seederService,
            @Value("${devweb.cron.secret:}") String cronSecret
    ) {
        this.seederService = seederService;
        this.cronSecret = cronSecret;
    }

    @PostMapping("/seed")
    public ResponseEntity<?> seed(
            @RequestHeader(value = "X-Cron-Secret", required = false) String secret
    ) {
        if (cronSecret.isBlank()) {
            return ResponseEntity.status(503)
                    .body(ApiResponse.fail("CONFIG_MISSING", "DEVWEB_CRON_SECRET 환경변수가 설정되지 않았습니다."));
        }
        if (!cronSecret.equals(secret)) {
            return ResponseEntity.status(403)
                    .body(ApiResponse.fail("UNAUTHORIZED", "인증 실패"));
        }

        log.info("[BankSeeder] 시딩 요청 수신");
        CsBankSeederService.SeedResult result = seederService.seed();
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
