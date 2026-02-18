package com.devweb.infra.persistence.recruitmenttracker;

import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentEntry;
import com.devweb.domain.recruitmenttracker.entry.port.RecruitmentEntryRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class RecruitmentEntryRepositoryAdapter implements RecruitmentEntryRepository {

    private final SpringDataRecruitmentEntryJpaRepository jpaRepository;

    public RecruitmentEntryRepositoryAdapter(SpringDataRecruitmentEntryJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public RecruitmentEntry save(RecruitmentEntry recruitmentEntry) {
        return jpaRepository.save(recruitmentEntry);
    }

    @Override
    public Optional<RecruitmentEntry> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public List<RecruitmentEntry> findAllByMemberId(Long memberId) {
        return jpaRepository.findAllByMemberId(memberId);
    }

    @Override
    public void delete(RecruitmentEntry recruitmentEntry) {
        jpaRepository.delete(recruitmentEntry);
    }
}


