package com.devweb.domain.resume.session.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "resume_answer_attempts")
public class ResumeAnswerAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private ResumeQuestion question;

    @Lob
    @Column(nullable = false)
    private String answerText;

    @Embedded
    private Feedback feedback;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected ResumeAnswerAttempt() {
    }

    ResumeAnswerAttempt(ResumeQuestion question, String answerText, Feedback feedback) {
        if (question == null) throw new IllegalArgumentException("question은 필수입니다.");
        if (answerText == null || answerText.isBlank()) throw new IllegalArgumentException("answerText는 필수입니다.");
        this.question = question;
        this.answerText = answerText;
        this.feedback = feedback;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public ResumeQuestion getQuestion() {
        return question;
    }

    public String getAnswerText() {
        return answerText;
    }

    public Feedback getFeedback() {
        return feedback;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

