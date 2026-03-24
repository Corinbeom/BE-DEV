package com.devweb.infra.persistence.studyquiz;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.studyquiz.session.model.*;
import com.devweb.infra.persistence.studyquiz.session.SpringDataCsQuizSessionJpaRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.cache.type=none",
        "spring.jpa.defer-datasource-initialization=false",
        "spring.sql.init.mode=never",
        "spring.jpa.properties.hibernate.generate_statistics=true"
})
@Transactional
class CsQuizSessionQueryCountTest {

    @Autowired EntityManagerFactory emf;
    @Autowired EntityManager em;
    @Autowired SpringDataCsQuizSessionJpaRepository sessionJpaRepo;

    private Member member;
    private Statistics statistics;

    @BeforeEach
    void setUp() {
        statistics = emf.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);

        member = new Member("querycount@example.com");
        em.persist(member);

        // 10 sessions × 5 questions each
        for (int s = 0; s < 10; s++) {
            CsQuizSession session = new CsQuizSession(
                    member, "세션" + s, CsQuizDifficulty.MID, Set.of(CsQuizTopic.OS)
            );
            List<CsQuizQuestion> questions = new ArrayList<>();
            for (int q = 0; q < 5; q++) {
                questions.add(CsQuizQuestion.multipleChoice(
                        q, CsQuizTopic.OS, CsQuizDifficulty.MID,
                        "문제" + q, List.of("A", "B", "C", "D"), 0, "참조"
                ));
            }
            session.markQuestionsReady(questions);
            em.persist(session);
        }

        em.flush();
        em.clear();
    }

    @Test
    @DisplayName("findAllByMemberId — @EntityGraph로 N+1 방지 (10세션×5문제, 쿼리 ≤3)")
    void findAllByMemberId_EntityGraph_N1_방지() {
        // given
        statistics.clear();

        // when
        List<CsQuizSession> sessions = sessionJpaRepo.findAllByMemberIdOrderByCreatedAtDesc(member.getId());

        // then: 결과 검증
        assertThat(sessions).hasSize(10);
        // 컬렉션 접근하여 lazy loading 유발
        long totalQuestions = sessions.stream()
                .mapToLong(s -> s.getQuestions().size())
                .sum();
        assertThat(totalQuestions).isEqualTo(50);

        // N+1 방지: EntityGraph 없으면 1(세션) + 10(questions) = 11쿼리
        // EntityGraph + BatchSize로 ≤3 쿼리
        long queryCount = statistics.getPrepareStatementCount();
        assertThat(queryCount).isLessThanOrEqualTo(3);
    }

    @Test
    @DisplayName("findStatsGroupedByTopic — 단일 집계 쿼리 실행")
    void findStatsGroupedByTopic_단일쿼리() {
        // given: attempt 데이터 추가
        List<CsQuizSession> sessions = sessionJpaRepo.findAllByMemberIdOrderByCreatedAtDesc(member.getId());
        for (CsQuizSession session : sessions) {
            for (CsQuizQuestion q : session.getQuestions()) {
                q.addAttempt(null, 0, true, null);
            }
        }
        em.flush();
        em.clear();
        statistics.clear();

        // when
        List<Object[]> rows = sessionJpaRepo.findStatsGroupedByTopic(member.getId());

        // then
        assertThat(rows).isNotEmpty();
        long queryCount = statistics.getPrepareStatementCount();
        assertThat(queryCount).isEqualTo(1);
    }
}
