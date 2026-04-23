package com.devweb.infra.persistence.studyquiz.bank;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 시드 데이터는 POST /api/internal/cs-bank/load 엔드포인트로 적재한다.
 * 이 Runner는 더 이상 하드코딩 데이터를 삽입하지 않는다.
 */
@Component
public class CsQuestionBankSeeder implements ApplicationRunner {

    @Override
    public void run(ApplicationArguments args) {
        // no-op
    }
}
