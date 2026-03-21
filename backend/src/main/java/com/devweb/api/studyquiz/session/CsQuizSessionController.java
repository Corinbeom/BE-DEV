package com.devweb.api.studyquiz.session;

import com.devweb.api.studyquiz.session.dto.CreateCsQuizSessionRequest;
import com.devweb.api.studyquiz.session.dto.CsQuizSessionResponse;
import com.devweb.api.studyquiz.session.dto.CsQuizStatsResponse;
import com.devweb.common.ApiResponse;
import com.devweb.common.AuthUtils;
import com.devweb.domain.studyquiz.session.model.CsQuizSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cs-quiz-sessions")
public class CsQuizSessionController {

    private final CsQuizSessionService service;

    public CsQuizSessionController(CsQuizSessionService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<CsQuizSessionResponse>> listByCurrentMember() {
        Long memberId = AuthUtils.currentMemberId();
        return ApiResponse.success(service.listByMemberCached(memberId));
    }

    @PostMapping
    public ApiResponse<CsQuizSessionResponse> create(@Valid @RequestBody CreateCsQuizSessionRequest req) {
        Long memberId = AuthUtils.currentMemberId();
        CsQuizSession created = service.create(
                memberId,
                req.difficulty(),
                req.topics(),
                req.questionCount(),
                req.title()
        );
        return ApiResponse.success(CsQuizSessionResponse.from(created));
    }

    @GetMapping("/stats")
    public ApiResponse<CsQuizStatsResponse> stats() {
        Long memberId = AuthUtils.currentMemberId();
        return ApiResponse.success(service.getStats(memberId));
    }

    @GetMapping("/{id}")
    public ApiResponse<CsQuizSessionResponse> get(@PathVariable Long id) {
        return ApiResponse.success(CsQuizSessionResponse.from(service.get(id)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
