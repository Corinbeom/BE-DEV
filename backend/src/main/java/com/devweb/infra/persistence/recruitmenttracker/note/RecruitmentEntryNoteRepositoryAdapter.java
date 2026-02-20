package com.devweb.infra.persistence.recruitmenttracker.note;

import com.devweb.domain.recruitmenttracker.note.model.RecruitmentEntryNote;
import com.devweb.domain.recruitmenttracker.note.port.RecruitmentEntryNoteRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class RecruitmentEntryNoteRepositoryAdapter implements RecruitmentEntryNoteRepository {

    private final SpringDataRecruitmentEntryNoteJpaRepository jpaRepository;

    public RecruitmentEntryNoteRepositoryAdapter(SpringDataRecruitmentEntryNoteJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public RecruitmentEntryNote save(RecruitmentEntryNote note) {
        return jpaRepository.save(note);
    }

    @Override
    public Optional<RecruitmentEntryNote> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public List<RecruitmentEntryNote> findAllByEntryId(Long entryId) {
        return jpaRepository.findAllByEntryIdOrderByCreatedAtAsc(entryId);
    }

    @Override
    public void delete(RecruitmentEntryNote note) {
        jpaRepository.delete(note);
    }
}


