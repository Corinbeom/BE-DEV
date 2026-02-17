package com.devweb.domain.recruitmenttracker.entry.port;

import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentEntry;

import java.util.List;
import java.util.Optional;

/**
 * Repository Port (DIP): domain은 구현(JPA)을 몰라야 한다.
 */
public interface RecruitmentEntryRepository {
    RecruitmentEntry save(RecruitmentEntry recruitmentEntry);

    Optional<RecruitmentEntry> findById(Long id);

    List<RecruitmentEntry> findAllByMemberId(Long memberId);

    void delete(RecruitmentEntry recruitmentEntry);
}


