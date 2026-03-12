package com.devweb.api.resume;

import com.devweb.api.resume.dto.ResumeResponse;
import com.devweb.common.ApiResponse;
import com.devweb.common.AuthUtils;
import com.devweb.domain.resume.model.Resume;
import com.devweb.domain.resume.model.ResumeFileType;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private final ResumeService service;

    public ResumeController(ResumeService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ResumeResponse> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam String fileType,
            @RequestParam(required = false) String title
    ) {
        Long memberId = AuthUtils.currentMemberId();
        ResumeFileType type = ResumeFileType.valueOf(fileType.toUpperCase());
        Resume resume = service.upload(memberId, file, type, title);
        return ApiResponse.success(ResumeResponse.from(resume));
    }

    @GetMapping
    public ApiResponse<List<ResumeResponse>> list() {
        Long memberId = AuthUtils.currentMemberId();
        return ApiResponse.success(
                service.listByMember(memberId).stream()
                        .map(ResumeResponse::from)
                        .toList()
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<ResumeResponse> get(@PathVariable Long id) {
        return ApiResponse.success(ResumeResponse.from(service.get(id)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        Long memberId = AuthUtils.currentMemberId();
        service.delete(memberId, id);
        return ApiResponse.ok();
    }
}
