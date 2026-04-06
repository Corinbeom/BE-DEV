package com.devweb.infra.persistence.resume;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.resume.model.InterviewQuestion;
import com.devweb.domain.resume.session.model.ResumeQuestion;
import com.devweb.domain.resume.session.model.ResumeSession;
import com.devweb.domain.resume.session.model.StoredFileRef;
import com.devweb.infra.persistence.resume.session.SpringDataResumeSessionJpaRepository;
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

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.cache.type=none",
        "spring.jpa.defer-datasource-initialization=false",
        "spring.sql.init.mode=never",
        "spring.jpa.properties.hibernate.generate_statistics=true"
})
@Transactional
class ResumeSessionQueryCountTest {

    @Autowired EntityManagerFactory emf;
    @Autowired EntityManager em;
    @Autowired SpringDataResumeSessionJpaRepository sessionJpaRepo;

    private Member member;
    private Statistics statistics;

    @BeforeEach
    void setUp() {
        statistics = emf.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);

        member = new Member("resume-qc@example.com");
        em.persist(member);

        // 5 sessions × 3 questions each
        for (int s = 0; s < 5; s++) {
            ResumeSession session = new ResumeSession(member, "BE", "세션" + s, null);
            session.attachFiles(
                    new StoredFileRef("key" + s, "resume.pdf", "application/pdf", 1024L),
                    null
            );
            session.markExtracted("이력서 텍스트", null);

            List<ResumeQuestion> questions = new ArrayList<>();
            for (int q = 0; q < 3; q++) {
                questions.add(new ResumeQuestion(
                        q, "badge" + q, 80,
                        new InterviewQuestion("질문" + q, "의도", "키워드", "모범답안")
                ));
            }
            session.markQuestionsReady(questions);
            em.persist(session);
        }

        em.flush();
        em.clear();
    }

    @Test
    @DisplayName("findAllByMemberId — @EntityGraph로 N+1 방지 (5세션×3질문, 쿼리 ≤2)")
    void findAllByMemberId_EntityGraph_N1_방지() {
        // given
        statistics.clear();

        // when
        List<ResumeSession> sessions = sessionJpaRepo.findAllByMemberIdOrderByCreatedAtDesc(member.getId());

        // then: 결과 검증
        assertThat(sessions).hasSize(5);
        long totalQuestions = sessions.stream()
                .mapToLong(s -> s.getQuestions().size())
                .sum();
        assertThat(totalQuestions).isEqualTo(15);

        // N+1 방지: EntityGraph 없으면 1 + 5 = 6쿼리
        // EntityGraph로 ≤2 쿼리
        long queryCount = statistics.getPrepareStatementCount();
        assertThat(queryCount).isLessThanOrEqualTo(2);
    }
}
