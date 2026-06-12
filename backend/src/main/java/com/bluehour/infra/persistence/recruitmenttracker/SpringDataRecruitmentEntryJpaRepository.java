package com.bluehour.infra.persistence.recruitmenttracker;

import com.bluehour.domain.recruitmenttracker.entry.model.RecruitmentEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataRecruitmentEntryJpaRepository extends JpaRepository<RecruitmentEntry, Long> {
    List<RecruitmentEntry> findAllByMemberId(Long memberId);
}


