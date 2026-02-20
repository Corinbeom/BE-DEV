package com.devweb.domain.recruitmenttracker.note.port;

import com.devweb.domain.recruitmenttracker.note.model.RecruitmentEntryNote;

import java.util.List;
import java.util.Optional;

/**
 * Repository Port (DIP): domain은 구현(JPA)을 몰라야 한다.
 */
public interface RecruitmentEntryNoteRepository {
    RecruitmentEntryNote save(RecruitmentEntryNote note);

    Optional<RecruitmentEntryNote> findById(Long id);

    List<RecruitmentEntryNote> findAllByEntryId(Long entryId);

    void delete(RecruitmentEntryNote note);
}


