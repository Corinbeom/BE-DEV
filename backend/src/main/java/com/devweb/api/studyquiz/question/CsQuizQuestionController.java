package com.devweb.api.studyquiz.question;

import com.devweb.api.studyquiz.question.dto.CreateCsQuizAttemptRequest;
import com.devweb.api.studyquiz.question.dto.CsQuizAttemptResponse;
import com.devweb.common.ApiResponse;
import com.devweb.domain.studyquiz.session.model.CsQuizAttempt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cs-quiz-questions")
public class CsQuizQuestionController {

    private final CsQuizQuestionService service;

    public CsQuizQuestionController(CsQuizQuestionService service) {
        this.service = service;
    }

    @PostMapping("/{id}/attempts")
    public ApiResponse<CsQuizAttemptResponse> submitAttempt(
            @PathVariable Long id,
            @RequestBody CreateCsQuizAttemptRequest req
    ) {
        CsQuizAttempt attempt = service.submitAttempt(id, req);
        return ApiResponse.success(CsQuizAttemptResponse.from(attempt));
    }
}

