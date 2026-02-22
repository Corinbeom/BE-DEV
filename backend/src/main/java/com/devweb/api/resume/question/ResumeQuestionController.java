package com.devweb.api.resume.question;

import com.devweb.api.resume.question.dto.CreateResumeFeedbackRequest;
import com.devweb.api.resume.question.dto.ResumeFeedbackResponse;
import com.devweb.common.ApiResponse;
import com.devweb.domain.resume.session.model.ResumeAnswerAttempt;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resume-questions")
public class ResumeQuestionController {

    private final ResumeQuestionService service;

    public ResumeQuestionController(ResumeQuestionService service) {
        this.service = service;
    }

    @PostMapping("/{id}/feedback")
    public ApiResponse<ResumeFeedbackResponse> feedback(
            @PathVariable Long id,
            @Valid @RequestBody CreateResumeFeedbackRequest req
    ) {
        ResumeAnswerAttempt attempt = service.createFeedback(id, req.answerText());
        return ApiResponse.success(ResumeFeedbackResponse.from(attempt));
    }
}

