package com.devweb.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * 구버전 DDL로 생성된 과도한 CHECK 제약 조건을 제거한다.
 * IF EXISTS를 사용하므로 멱등적으로 실행 가능. prod(PostgreSQL) 전용.
 */
@Component
@Profile("!test")
public class SchemaConstraintFixer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaConstraintFixer.class);

    private final DataSource dataSource;

    public SchemaConstraintFixer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // position_type / status 허용값을 코드로 관리하므로 DB 레벨 CHECK 제약 불필요
            stmt.execute(
                "ALTER TABLE resume_sessions DROP CONSTRAINT IF EXISTS resume_sessions_position_type_check"
            );
            log.info("[SchemaFixer] resume_sessions_position_type_check 제약 조건 제거 완료");

            stmt.execute(
                "ALTER TABLE resume_sessions DROP CONSTRAINT IF EXISTS resume_sessions_status_check"
            );
            log.info("[SchemaFixer] resume_sessions_status_check 제약 조건 제거 완료");

        } catch (Exception e) {
            // H2(dev) 등 제약 조건이 없는 환경에서는 무시
            log.debug("[SchemaFixer] 제약 조건 제거 skip: {}", e.getMessage());
        }
    }
}
