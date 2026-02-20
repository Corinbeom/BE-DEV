package com.devweb.api.recruitmenttracker.entry.note.dto;

import com.devweb.domain.recruitmenttracker.note.model.RecruitmentEntryNote;

import java.time.Instant;

public record RecruitmentEntryNoteResponse(
        Long id,
        Long entryId,
        String content,
        Instant createdAt,
        Instant updatedAt
) {
    public static RecruitmentEntryNoteResponse from(RecruitmentEntryNote note) {
        return new RecruitmentEntryNoteResponse(
                note.getId(),
                note.getEntry().getId(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}


