package com.devweb.api.resume.session;

import com.devweb.api.resume.session.dto.ResumeSessionResponse;
import com.devweb.common.ApiResponse;
import com.devweb.domain.resume.session.model.ResumeSession;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resume-sessions")
public class ResumeSessionController {

    private final ResumeSessionService service;

    public ResumeSessionController(ResumeSessionService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ResumeSessionResponse> create(
            @RequestParam Long memberId,
            @RequestParam String positionType,
            @RequestPart("resumeFile") MultipartFile resumeFile,
            @RequestPart(value = "portfolioFile", required = false) MultipartFile portfolioFile,
            @RequestParam(required = false) String portfolioUrl,
            @RequestParam(required = false) String title
    ) {
        ResumeSession created = service.create(memberId, positionType, title, resumeFile, portfolioFile, portfolioUrl);
        return ApiResponse.success(ResumeSessionResponse.from(created));
    }

    @GetMapping("/{id}")
    public ApiResponse<ResumeSessionResponse> get(@PathVariable Long id) {
        return ApiResponse.success(ResumeSessionResponse.from(service.get(id)));
    }
}

