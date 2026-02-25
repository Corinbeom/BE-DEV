package com.devweb.api.studyquiz.session;

import com.devweb.api.studyquiz.session.dto.CreateCsQuizSessionRequest;
import com.devweb.api.studyquiz.session.dto.CsQuizSessionResponse;
import com.devweb.common.ApiResponse;
import com.devweb.domain.studyquiz.session.model.CsQuizSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cs-quiz-sessions")
public class CsQuizSessionController {

    private final CsQuizSessionService service;

    public CsQuizSessionController(CsQuizSessionService service) {
        this.service = service;
    }

    @PostMapping
    public ApiResponse<CsQuizSessionResponse> create(@Valid @RequestBody CreateCsQuizSessionRequest req) {
        CsQuizSession created = service.create(
                req.memberId(),
                req.difficulty(),
                req.topics(),
                req.questionCount(),
                req.title()
        );
        return ApiResponse.success(CsQuizSessionResponse.from(created));
    }

    @GetMapping("/{id}")
    public ApiResponse<CsQuizSessionResponse> get(@PathVariable Long id) {
        return ApiResponse.success(CsQuizSessionResponse.from(service.get(id)));
    }
}

