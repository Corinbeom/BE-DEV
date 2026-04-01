package com.devweb.infra.persistence.resume.session;

import com.devweb.domain.resume.session.model.ResumeSession;
import com.devweb.domain.resume.session.port.ResumeSessionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ResumeSessionRepositoryAdapter implements ResumeSessionRepository {

    private final SpringDataResumeSessionJpaRepository repo;

    public ResumeSessionRepositoryAdapter(SpringDataResumeSessionJpaRepository repo) {
        this.repo = repo;
    }

    @Override
    public ResumeSession save(ResumeSession session) {
        return repo.save(session);
    }

    @Override
    public Optional<ResumeSession> findById(Long id) {
        return repo.findById(id);
    }

    @Override
    public List<ResumeSession> findAllByMemberId(Long memberId) {
        return repo.findAllByMemberIdOrderByCreatedAtDesc(memberId);
    }

    @Override
    public void deleteById(Long id) {
        repo.deleteById(id);
    }

    @Override
    public List<Object[]> findInterviewStatsGroupedByBadge(Long memberId) {
        return repo.findInterviewStatsGroupedByBadge(memberId);
    }

    @Override
    public List<Object[]> countStrengthsByBadge(Long memberId) {
        return repo.countStrengthsByBadge(memberId);
    }

    @Override
    public List<Object[]> countImprovementsByBadge(Long memberId) {
        return repo.countImprovementsByBadge(memberId);
    }

    @Override
    public List<Object[]> findTopStrengthsByBadge(Long memberId) {
        return repo.findTopStrengthsByBadge(memberId);
    }

    @Override
    public List<Object[]> findTopImprovementsByBadge(Long memberId) {
        return repo.findTopImprovementsByBadge(memberId);
    }

    @Override
    public List<Object[]> findDailyAttemptCounts(Long memberId) {
        return repo.findDailyAttemptCounts(memberId);
    }

    @Override
    public List<Object[]> findDailyStrengthCounts(Long memberId) {
        return repo.findDailyStrengthCounts(memberId);
    }

    @Override
    public List<Object[]> findDailyImprovementCounts(Long memberId) {
        return repo.findDailyImprovementCounts(memberId);
    }
}

