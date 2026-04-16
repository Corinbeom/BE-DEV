package com.devweb.api.resume.session.dto;

import com.devweb.api.resume.question.dto.ResumeFeedbackResponse;
import com.devweb.domain.resume.model.InterviewQuestion;
import com.devweb.domain.resume.session.model.ResumeQuestion;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public record ResumeQuestionResponse(
        Long id,
        int orderIndex,
        String badge,
        int likelihood,
        String question,
        String intention,
        String keywords,
        String modelAnswer,
        List<ResumeFeedbackResponse> attempts
) implements Serializable {
    public static ResumeQuestionResponse from(ResumeQuestion q) {
        InterviewQuestion vo = q.getInterviewQuestion();
        List<ResumeFeedbackResponse> attemptList = new ArrayList<>(
                q.getAttempts().stream().map(ResumeFeedbackResponse::from).toList()
        );
        return new ResumeQuestionResponse(
                q.getId(),
                q.getOrderIndex(),
                q.getBadge(),
                q.getLikelihood(),
                vo == null ? null : vo.getQuestion(),
                vo == null ? null : vo.getIntention(),
                vo == null ? null : vo.getKeywords(),
                vo == null ? null : vo.getModelAnswer(),
                attemptList
        );
    }
}

