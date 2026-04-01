package com.devweb.api.studyquiz.question;

import com.devweb.api.studyquiz.question.dto.CreateCsQuizAttemptRequest;
import com.devweb.api.studyquiz.question.dto.CsQuizAttemptResponse;
import com.devweb.common.ApiResponse;
import com.devweb.domain.studyquiz.session.model.CsQuizAttempt;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@Tag(name = "CS 퀴즈 답변", description = "CS 퀴즈 문제 답변 제출")
@RestController
@RequestMapping("/api/cs-quiz-questions")
public class CsQuizQuestionController {

    private final CsQuizQuestionService service;

    public CsQuizQuestionController(CsQuizQuestionService service) {
        this.service = service;
    }

    @Operation(summary = "퀴즈 답변 제출", description = "퀴즈 문제에 답변을 제출하고 정답 여부와 AI 피드백을 받습니다.")
    @PostMapping("/{id}/attempts")
    public ApiResponse<CsQuizAttemptResponse> submitAttempt(
            @PathVariable Long id,
            @Valid @RequestBody CreateCsQuizAttemptRequest req
    ) {
        CsQuizAttempt attempt = service.submitAttempt(id, req);
        return ApiResponse.success(CsQuizAttemptResponse.from(attempt));
    }
}

