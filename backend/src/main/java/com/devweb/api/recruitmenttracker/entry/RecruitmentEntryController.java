package com.devweb.api.recruitmenttracker.entry;

import com.devweb.api.recruitmenttracker.entry.dto.*;
import com.devweb.common.ApiResponse;
import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentEntry;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recruitment-entries")
public class RecruitmentEntryController {

    private final RecruitmentEntryService service;

    public RecruitmentEntryController(RecruitmentEntryService service) {
        this.service = service;
    }

    @PostMapping
    public ApiResponse<RecruitmentEntryResponse> create(@Valid @RequestBody CreateRecruitmentEntryRequest req) {
        RecruitmentEntry created = service.create(
                req.memberId(),
                req.companyName(),
                req.position(),
                req.step(),
                req.platformType(),
                req.externalId()
        );
        return ApiResponse.success(RecruitmentEntryResponse.from(created));
    }

    @GetMapping("/{id}")
    public ApiResponse<RecruitmentEntryResponse> get(@PathVariable Long id) {
        return ApiResponse.success(RecruitmentEntryResponse.from(service.get(id)));
    }

    @GetMapping("/by-member/{memberId}")
    public ApiResponse<List<RecruitmentEntryResponse>> listByMember(@PathVariable Long memberId) {
        List<RecruitmentEntryResponse> result = service.listByMember(memberId).stream()
                .map(RecruitmentEntryResponse::from)
                .toList();
        return ApiResponse.success(result);
    }

    @PutMapping("/{id}")
    public ApiResponse<RecruitmentEntryResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRecruitmentEntryRequest req
    ) {
        RecruitmentEntry updated = service.update(
                id,
                req.companyName(),
                req.position(),
                req.step(),
                req.platformType(),
                req.externalId()
        );
        return ApiResponse.success(RecruitmentEntryResponse.from(updated));
    }

    @PatchMapping("/{id}/step")
    public ApiResponse<RecruitmentEntryResponse> changeStep(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRecruitmentStepRequest req
    ) {
        return ApiResponse.success(RecruitmentEntryResponse.from(service.changeStep(id, req.step())));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.ok();
    }
}


