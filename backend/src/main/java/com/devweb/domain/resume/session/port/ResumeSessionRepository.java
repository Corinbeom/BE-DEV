package com.devweb.domain.resume.session.port;

import com.devweb.domain.resume.session.model.ResumeSession;

import java.util.List;
import java.util.Optional;

public interface ResumeSessionRepository {
    ResumeSession save(ResumeSession session);

    Optional<ResumeSession> findById(Long id);

    List<ResumeSession> findAllByMemberId(Long memberId);

    void deleteById(Long id);

    List<Object[]> findInterviewStatsGroupedByBadge(Long memberId);

    List<Object[]> countStrengthsByBadge(Long memberId);

    List<Object[]> countImprovementsByBadge(Long memberId);

    List<Object[]> findTopStrengthsByBadge(Long memberId);

    List<Object[]> findTopImprovementsByBadge(Long memberId);

    List<Object[]> findDailyAttemptCounts(Long memberId);

    List<Object[]> findDailyStrengthCounts(Long memberId);

    List<Object[]> findDailyImprovementCounts(Long memberId);
}

