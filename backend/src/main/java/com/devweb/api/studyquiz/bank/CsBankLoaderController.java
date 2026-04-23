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
public class CsBankLoaderController {

    private static final Logger log = LoggerFactory.getLogger(CsBankLoaderController.class);

    private final CsBankLoaderService loaderService;
    private final String cronSecret;

    public CsBankLoaderController(
            CsBankLoaderService loaderService,
            @Value("${devweb.cron.secret:}") String cronSecret
    ) {
        this.loaderService = loaderService;
        this.cronSecret = cronSecret;
    }

    @PostMapping("/load")
    public ResponseEntity<?> load(
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

        log.info("[BankLoader] 시드 로드 요청 수신");
        try {
            CsBankLoaderService.LoadResult result = loaderService.load();
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("[BankLoader] 로드 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.fail("LOAD_FAILED", e.getMessage()));
        }
    }
}
