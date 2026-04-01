package com.devweb.api.resume.question;

import com.devweb.api.resume.question.dto.CreateResumeFeedbackRequest;
import com.devweb.api.resume.question.dto.ResumeFeedbackResponse;
import com.devweb.common.ApiResponse;
import com.devweb.domain.resume.session.model.ResumeAnswerAttempt;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@Tag(name = "면접 질문 피드백", description = "AI 면접 질문에 대한 답변 제출 및 피드백")
@RestController
@RequestMapping("/api/resume-questions")
public class ResumeQuestionController {

    private final ResumeQuestionService service;

    public ResumeQuestionController(ResumeQuestionService service) {
        this.service = service;
    }

    @Operation(summary = "답변 제출 및 피드백", description = "면접 질문에 답변을 제출하면 AI가 강점, 개선점, 모범답안을 피드백합니다.")
    @PostMapping("/{id}/feedback")
    public ApiResponse<ResumeFeedbackResponse> feedback(
            @PathVariable Long id,
            @Valid @RequestBody CreateResumeFeedbackRequest req
    ) {
        ResumeAnswerAttempt attempt = service.createFeedback(id, req.answerText());
        return ApiResponse.success(ResumeFeedbackResponse.from(attempt));
    }
}

