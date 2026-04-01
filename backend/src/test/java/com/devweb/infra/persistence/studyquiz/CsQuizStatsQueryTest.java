package com.devweb.infra.persistence.studyquiz;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.studyquiz.session.model.*;
import com.devweb.infra.persistence.studyquiz.session.SpringDataCsQuizSessionJpaRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.cache.type=none",
        "spring.jpa.defer-datasource-initialization=false",
        "spring.sql.init.mode=never"
})
@Transactional
class CsQuizStatsQueryTest {

    @Autowired EntityManager em;
    @Autowired SpringDataCsQuizSessionJpaRepository sessionJpaRepo;

    private Member member;

    @BeforeEach
    void setUp() {
        member = new Member("stats-test@example.com");
        em.persist(member);
        em.flush();
    }

    @Test
    @DisplayName("단일 토픽 — 정답/오답 집계 정확성")
    void 단일토픽_정답오답_집계_정확성() {
        // given: OS 토픽, 3시도 중 2정답
        CsQuizSession session = createSession(Set.of(CsQuizTopic.OS));
        CsQuizQuestion q = CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.OS, CsQuizDifficulty.MID,
                "프로세스와 스레드 차이?", List.of("A", "B", "C", "D"), 0, "참조"
        );
        session.markQuestionsReady(List.of(q));
        em.persist(session);
        em.flush();

        q.addAttempt(null, 0, true, null);   // 정답
        q.addAttempt(null, 1, false, null);  // 오답
        q.addAttempt(null, 0, true, null);   // 정답
        em.flush();

        // when
        List<Object[]> rows = sessionJpaRepo.findStatsGroupedByTopic(member.getId());

        // then
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(CsQuizTopic.OS);
        assertThat(((Long) rows.get(0)[1]).intValue()).isEqualTo(3);  // total
        assertThat(((Long) rows.get(0)[2]).intValue()).isEqualTo(2);  // correct
    }

    @Test
    @DisplayName("다중 토픽 — 그룹별 집계 정확성")
    void 다중토픽_그룹별_집계() {
        // given: OS 2시도(1정답), DB 1시도(1정답)
        CsQuizSession session = createSession(Set.of(CsQuizTopic.OS, CsQuizTopic.DB));
        CsQuizQuestion qOs = CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.OS, CsQuizDifficulty.MID,
                "OS 질문", List.of("A", "B"), 0, "참조"
        );
        CsQuizQuestion qDb = CsQuizQuestion.multipleChoice(
                1, CsQuizTopic.DB, CsQuizDifficulty.MID,
                "DB 질문", List.of("A", "B"), 0, "참조"
        );
        session.markQuestionsReady(List.of(qOs, qDb));
        em.persist(session);
        em.flush();

        qOs.addAttempt(null, 0, true, null);
        qOs.addAttempt(null, 1, false, null);
        qDb.addAttempt(null, 0, true, null);
        em.flush();

        // when
        List<Object[]> rows = sessionJpaRepo.findStatsGroupedByTopic(member.getId());

        // then
        assertThat(rows).hasSize(2);
        for (Object[] row : rows) {
            CsQuizTopic topic = (CsQuizTopic) row[0];
            int total = ((Long) row[1]).intValue();
            int correct = ((Long) row[2]).intValue();
            if (topic == CsQuizTopic.OS) {
                assertThat(total).isEqualTo(2);
                assertThat(correct).isEqualTo(1);
            } else if (topic == CsQuizTopic.DB) {
                assertThat(total).isEqualTo(1);
                assertThat(correct).isEqualTo(1);
            } else {
                fail("예상치 못한 토픽: " + topic);
            }
        }
    }

    @Test
    @DisplayName("시도 없는 세션 — 빈 결과 반환")
    void 시도없는_세션_결과없음() {
        // given: 세션만 있고 attempt 없음
        CsQuizSession session = createSession(Set.of(CsQuizTopic.NETWORK));
        CsQuizQuestion q = CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.NETWORK, CsQuizDifficulty.LOW,
                "질문", List.of("A", "B"), 0, "참조"
        );
        session.markQuestionsReady(List.of(q));
        em.persist(session);
        em.flush();

        // when
        List<Object[]> rows = sessionJpaRepo.findStatsGroupedByTopic(member.getId());

        // then
        assertThat(rows).isEmpty();
    }

    @Test
    @DisplayName("correct가 null인 시도는 집계에서 제외")
    void correct_null인_시도_제외() {
        // given
        CsQuizSession session = createSession(Set.of(CsQuizTopic.JAVA));
        CsQuizQuestion q = CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.JAVA, CsQuizDifficulty.HIGH,
                "질문", List.of("A", "B"), 0, "참조"
        );
        session.markQuestionsReady(List.of(q));
        em.persist(session);
        em.flush();

        q.addAttempt(null, 0, true, null);   // correct=true → 집계 포함
        q.addAttempt(null, 1, null, null);   // correct=null → 집계 제외
        em.flush();

        // when
        List<Object[]> rows = sessionJpaRepo.findStatsGroupedByTopic(member.getId());

        // then
        assertThat(rows).hasSize(1);
        assertThat(((Long) rows.get(0)[1]).intValue()).isEqualTo(1);  // null 제외하여 1건
        assertThat(((Long) rows.get(0)[2]).intValue()).isEqualTo(1);
    }

    @Test
    @DisplayName("다른 멤버 데이터는 결과에 포함되지 않음")
    void 다른멤버_데이터_격리() {
        // given: member의 데이터
        CsQuizSession session = createSession(Set.of(CsQuizTopic.OS));
        CsQuizQuestion q = CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.OS, CsQuizDifficulty.MID,
                "질문", List.of("A", "B"), 0, "참조"
        );
        session.markQuestionsReady(List.of(q));
        em.persist(session);
        em.flush();
        q.addAttempt(null, 0, true, null);
        em.flush();

        // given: 다른 멤버의 데이터
        Member other = new Member("other@example.com");
        em.persist(other);
        CsQuizSession otherSession = new CsQuizSession(other, "Other", CsQuizDifficulty.MID, Set.of(CsQuizTopic.OS));
        CsQuizQuestion oq = CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.OS, CsQuizDifficulty.MID,
                "질문2", List.of("A", "B"), 0, "참조"
        );
        otherSession.markQuestionsReady(List.of(oq));
        em.persist(otherSession);
        em.flush();
        oq.addAttempt(null, 0, true, null);
        oq.addAttempt(null, 1, false, null);
        em.flush();

        // when: member의 통계만 조회
        List<Object[]> rows = sessionJpaRepo.findStatsGroupedByTopic(member.getId());

        // then: member의 1건만 포함
        assertThat(rows).hasSize(1);
        assertThat(((Long) rows.get(0)[1]).intValue()).isEqualTo(1);
    }

    private CsQuizSession createSession(Set<CsQuizTopic> topics) {
        return new CsQuizSession(member, "테스트 세션", CsQuizDifficulty.MID, topics);
    }
}
