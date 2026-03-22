package com.devweb.infra.persistence.studyquiz.session;

import com.devweb.domain.studyquiz.session.model.CsQuizSession;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SpringDataCsQuizSessionJpaRepository extends JpaRepository<CsQuizSession, Long> {

    @EntityGraph(attributePaths = {"questions"})
    List<CsQuizSession> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);

    /**
     * Stats용 집계 쿼리: 엔티티 로딩 없이 SQL 1회로 topic별 통계 산출.
     * 반환: [CsQuizTopic, Long(totalAttempts), Long(correctCount)]
     */
    @Query("""
            SELECT q.topic, COUNT(a), SUM(CASE WHEN a.correct = true THEN 1L ELSE 0L END)
            FROM CsQuizAttempt a
            JOIN a.question q
            JOIN q.session s
            WHERE s.member.id = :memberId AND a.correct IS NOT NULL
            GROUP BY q.topic
            """)
    List<Object[]> findStatsGroupedByTopic(@Param("memberId") Long memberId);
}
