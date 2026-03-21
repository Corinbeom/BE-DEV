package com.devweb.api.resume.session;

import com.devweb.api.resume.session.dto.CreateResumeSessionRequest;
import com.devweb.api.resume.session.dto.ResumeSessionResponse;
import com.devweb.common.ApiResponse;
import com.devweb.common.AuthUtils;
import com.devweb.domain.resume.session.model.ResumeSession;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resume-sessions")
public class ResumeSessionController {

    private final ResumeSessionService service;

    public ResumeSessionController(ResumeSessionService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<ResumeSessionResponse>> listByCurrentMember() {
        Long memberId = AuthUtils.currentMemberId();
        return ApiResponse.success(
                service.listByMember(memberId).stream()
                        .map(ResumeSessionResponse::from)
                        .toList()
        );
    }

    @PostMapping
    public ApiResponse<ResumeSessionResponse> create(@RequestBody CreateResumeSessionRequest request) {
        Long memberId = AuthUtils.currentMemberId();
        ResumeSession created = service.createFromResume(
                memberId,
                request.positionType(),
                request.title(),
                request.resumeId(),
                request.portfolioResumeId(),
                request.portfolioUrl()
        );
        return ApiResponse.success(ResumeSessionResponse.from(created));
    }

    @GetMapping("/{id}")
    public ApiResponse<ResumeSessionResponse> get(@PathVariable Long id) {
        return ApiResponse.success(ResumeSessionResponse.from(service.get(id)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
