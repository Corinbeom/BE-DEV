package com.devweb.infra.persistence.resume.session;

import com.devweb.domain.resume.session.model.ResumeSession;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SpringDataResumeSessionJpaRepository extends JpaRepository<ResumeSession, Long> {

    @EntityGraph(attributePaths = {"questions"})
    List<ResumeSession> findAllByMemberIdOrderByCreatedAtDesc(Long memberId);

    @Query("""
            SELECT q.badge,
                   COUNT(DISTINCT q.id),
                   COUNT(DISTINCT CASE WHEN a.id IS NOT NULL THEN q.id END),
                   COUNT(a.id)
            FROM ResumeQuestion q
            JOIN q.session s
            LEFT JOIN q.attempts a
            WHERE s.member.id = :memberId
              AND s.status = com.devweb.domain.resume.session.model.ResumeSessionStatus.QUESTIONS_READY
            GROUP BY q.badge
            """)
    List<Object[]> findInterviewStatsGroupedByBadge(@Param("memberId") Long memberId);

    @Query(value = """
            SELECT q.badge, COUNT(s.strength)
            FROM resume_feedback_strengths s
            JOIN resume_answer_attempts a ON s.attempt_id = a.id
            JOIN resume_questions q ON a.question_id = q.id
            JOIN resume_sessions rs ON q.session_id = rs.id
            WHERE rs.member_id = :memberId AND rs.status = 'QUESTIONS_READY'
            GROUP BY q.badge
            """, nativeQuery = true)
    List<Object[]> countStrengthsByBadge(@Param("memberId") Long memberId);

    @Query(value = """
            SELECT q.badge, COUNT(i.improvement)
            FROM resume_feedback_improvements i
            JOIN resume_answer_attempts a ON i.attempt_id = a.id
            JOIN resume_questions q ON a.question_id = q.id
            JOIN resume_sessions rs ON q.session_id = rs.id
            WHERE rs.member_id = :memberId AND rs.status = 'QUESTIONS_READY'
            GROUP BY q.badge
            """, nativeQuery = true)
    List<Object[]> countImprovementsByBadge(@Param("memberId") Long memberId);

    @Query(value = """
            SELECT q.badge, s.strength, COUNT(*) as freq
            FROM resume_feedback_strengths s
            JOIN resume_answer_attempts a ON s.attempt_id = a.id
            JOIN resume_questions q ON a.question_id = q.id
            JOIN resume_sessions rs ON q.session_id = rs.id
            WHERE rs.member_id = :memberId AND rs.status = 'QUESTIONS_READY'
            GROUP BY q.badge, s.strength
            ORDER BY q.badge, freq DESC
            """, nativeQuery = true)
    List<Object[]> findTopStrengthsByBadge(@Param("memberId") Long memberId);

    @Query(value = """
            SELECT q.badge, i.improvement, COUNT(*) as freq
            FROM resume_feedback_improvements i
            JOIN resume_answer_attempts a ON i.attempt_id = a.id
            JOIN resume_questions q ON a.question_id = q.id
            JOIN resume_sessions rs ON q.session_id = rs.id
            WHERE rs.member_id = :memberId AND rs.status = 'QUESTIONS_READY'
            GROUP BY q.badge, i.improvement
            ORDER BY q.badge, freq DESC
            """, nativeQuery = true)
    List<Object[]> findTopImprovementsByBadge(@Param("memberId") Long memberId);

    @Query(value = """
            SELECT CAST(a.created_at AS DATE) as attempt_date, COUNT(*) as cnt
            FROM resume_answer_attempts a
            JOIN resume_questions q ON a.question_id = q.id
            JOIN resume_sessions rs ON q.session_id = rs.id
            WHERE rs.member_id = :memberId AND rs.status = 'QUESTIONS_READY'
            GROUP BY CAST(a.created_at AS DATE)
            ORDER BY attempt_date
            """, nativeQuery = true)
    List<Object[]> findDailyAttemptCounts(@Param("memberId") Long memberId);

    @Query(value = """
            SELECT CAST(a.created_at AS DATE) as attempt_date, COUNT(s.strength) as cnt
            FROM resume_feedback_strengths s
            JOIN resume_answer_attempts a ON s.attempt_id = a.id
            JOIN resume_questions q ON a.question_id = q.id
            JOIN resume_sessions rs ON q.session_id = rs.id
            WHERE rs.member_id = :memberId AND rs.status = 'QUESTIONS_READY'
            GROUP BY CAST(a.created_at AS DATE)
            ORDER BY attempt_date
            """, nativeQuery = true)
    List<Object[]> findDailyStrengthCounts(@Param("memberId") Long memberId);

    @Query(value = """
            SELECT CAST(a.created_at AS DATE) as attempt_date, COUNT(i.improvement) as cnt
            FROM resume_feedback_improvements i
            JOIN resume_answer_attempts a ON i.attempt_id = a.id
            JOIN resume_questions q ON a.question_id = q.id
            JOIN resume_sessions rs ON q.session_id = rs.id
            WHERE rs.member_id = :memberId AND rs.status = 'QUESTIONS_READY'
            GROUP BY CAST(a.created_at AS DATE)
            ORDER BY attempt_date
            """, nativeQuery = true)
    List<Object[]> findDailyImprovementCounts(@Param("memberId") Long memberId);
}

