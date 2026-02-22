package com.devweb.api.resume.question;

import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.resume.model.InterviewQuestion;
import com.devweb.domain.resume.session.model.Feedback;
import com.devweb.domain.resume.session.model.PositionType;
import com.devweb.domain.resume.session.model.ResumeAnswerAttempt;
import com.devweb.domain.resume.session.model.ResumeQuestion;
import com.devweb.domain.resume.session.port.ResumeQuestionRepository;
import com.devweb.domain.resume.session.service.AnswerFeedbackGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ResumeQuestionService {

    private final ResumeQuestionRepository questionRepository;
    private final AnswerFeedbackGenerator feedbackGenerator;

    public ResumeQuestionService(
            ResumeQuestionRepository questionRepository,
            AnswerFeedbackGenerator feedbackGenerator
    ) {
        this.questionRepository = questionRepository;
        this.feedbackGenerator = feedbackGenerator;
    }

    public ResumeAnswerAttempt createFeedback(Long questionId, String answerText) {
        ResumeQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("ResumeQuestion을 찾을 수 없습니다. id=" + questionId));

        PositionType positionType = question.getSession().getPositionType();
        InterviewQuestion vo = question.getInterviewQuestion();

        Feedback feedback = feedbackGenerator.generate(
                positionType,
                vo == null ? null : vo.getQuestion(),
                vo == null ? null : vo.getIntention(),
                vo == null ? null : vo.getKeywords(),
                vo == null ? null : vo.getModelAnswer(),
                answerText
        );

        ResumeAnswerAttempt attempt = question.addAttempt(answerText, feedback);
        questionRepository.save(question);
        return attempt;
    }
}

