package com.devweb.api.recruitmenttracker.entry.note;

import com.devweb.api.recruitmenttracker.entry.note.dto.CreateRecruitmentEntryNoteRequest;
import com.devweb.api.recruitmenttracker.entry.note.dto.RecruitmentEntryNoteResponse;
import com.devweb.api.recruitmenttracker.entry.note.dto.UpdateRecruitmentEntryNoteRequest;
import com.devweb.common.ApiResponse;
import com.devweb.domain.recruitmenttracker.note.model.RecruitmentEntryNote;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recruitment-entries/{entryId}/notes")
public class RecruitmentEntryNoteController {

    private final RecruitmentEntryNoteService service;

    public RecruitmentEntryNoteController(RecruitmentEntryNoteService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<RecruitmentEntryNoteResponse>> list(@PathVariable Long entryId) {
        List<RecruitmentEntryNoteResponse> result = service.list(entryId).stream()
                .map(RecruitmentEntryNoteResponse::from)
                .toList();
        return ApiResponse.success(result);
    }

    @PostMapping
    public ApiResponse<RecruitmentEntryNoteResponse> create(
            @PathVariable Long entryId,
            @Valid @RequestBody CreateRecruitmentEntryNoteRequest req
    ) {
        RecruitmentEntryNote created = service.create(entryId, req.content());
        return ApiResponse.success(RecruitmentEntryNoteResponse.from(created));
    }

    @PutMapping("/{noteId}")
    public ApiResponse<RecruitmentEntryNoteResponse> update(
            @PathVariable Long entryId,
            @PathVariable Long noteId,
            @Valid @RequestBody UpdateRecruitmentEntryNoteRequest req
    ) {
        RecruitmentEntryNote updated = service.update(entryId, noteId, req.content());
        return ApiResponse.success(RecruitmentEntryNoteResponse.from(updated));
    }

    @DeleteMapping("/{noteId}")
    public ApiResponse<Void> delete(
            @PathVariable Long entryId,
            @PathVariable Long noteId
    ) {
        service.delete(entryId, noteId);
        return ApiResponse.ok();
    }
}


