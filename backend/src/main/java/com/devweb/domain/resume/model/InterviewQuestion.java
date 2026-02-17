package com.devweb.domain.resume.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.util.Objects;

/**
 * Value Object (VO): 질문 자체의 동일성은 값으로만 판단한다.
 */
@Embeddable
public class InterviewQuestion {

    @Column(name = "question", length = 2000)
    private String question;

    @Column(name = "intention", length = 2000)
    private String intention;

    @Column(name = "keywords", length = 2000)
    private String keywords;

    @Column(name = "model_answer", length = 4000)
    private String modelAnswer;

    protected InterviewQuestion() {
    }

    public InterviewQuestion(String question, String intention, String keywords, String modelAnswer) {
        if (question == null || question.isBlank()) throw new IllegalArgumentException("question은 필수입니다.");
        this.question = question;
        this.intention = intention;
        this.keywords = keywords;
        this.modelAnswer = modelAnswer;
    }

    public String getQuestion() {
        return question;
    }

    public String getIntention() {
        return intention;
    }

    public String getKeywords() {
        return keywords;
    }

    public String getModelAnswer() {
        return modelAnswer;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        InterviewQuestion that = (InterviewQuestion) o;
        return Objects.equals(question, that.question)
                && Objects.equals(intention, that.intention)
                && Objects.equals(keywords, that.keywords)
                && Objects.equals(modelAnswer, that.modelAnswer);
    }

    @Override
    public int hashCode() {
        return Objects.hash(question, intention, keywords, modelAnswer);
    }
}


