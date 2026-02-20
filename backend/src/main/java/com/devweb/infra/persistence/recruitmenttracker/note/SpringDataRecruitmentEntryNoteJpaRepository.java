package com.devweb.infra.persistence.recruitmenttracker.note;

import com.devweb.domain.recruitmenttracker.note.model.RecruitmentEntryNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataRecruitmentEntryNoteJpaRepository extends JpaRepository<RecruitmentEntryNote, Long> {
    List<RecruitmentEntryNote> findAllByEntryIdOrderByCreatedAtAsc(Long entryId);
}


