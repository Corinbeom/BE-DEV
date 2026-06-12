package com.bluehour.api.recruitmenttracker.entry.note.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateRecruitmentEntryNoteRequest(
        @NotBlank String content
) {
}


