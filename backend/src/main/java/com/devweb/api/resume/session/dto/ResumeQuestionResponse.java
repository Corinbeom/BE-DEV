package com.devweb.api.resume.session.dto;

import com.devweb.domain.resume.model.InterviewQuestion;
import com.devweb.domain.resume.session.model.ResumeQuestion;

public record ResumeQuestionResponse(
        Long id,
        int orderIndex,
        String badge,
        int likelihood,
        String question,
        String intention,
        String keywords,
        String modelAnswer
) {
    public static ResumeQuestionResponse from(ResumeQuestion q) {
        InterviewQuestion vo = q.getInterviewQuestion();
        return new ResumeQuestionResponse(
                q.getId(),
                q.getOrderIndex(),
                q.getBadge(),
                q.getLikelihood(),
                vo == null ? null : vo.getQuestion(),
                vo == null ? null : vo.getIntention(),
                vo == null ? null : vo.getKeywords(),
                vo == null ? null : vo.getModelAnswer()
        );
    }
}

