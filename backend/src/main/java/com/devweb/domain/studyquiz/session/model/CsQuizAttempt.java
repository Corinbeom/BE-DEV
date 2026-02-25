package com.devweb.domain.studyquiz.session.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cs_quiz_attempts")
public class CsQuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private CsQuizQuestion question;

    @Lob
    @Column(name = "answer_text")
    private String answerText;

    @Column(name = "selected_choice_index")
    private Integer selectedChoiceIndex;

    @Column(name = "is_correct")
    private Boolean correct;

    @Embedded
    private CsQuizFeedback feedback;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected CsQuizAttempt() {
    }

    public CsQuizAttempt(CsQuizQuestion question, String answerText, Integer selectedChoiceIndex, Boolean correct, CsQuizFeedback feedback) {
        if (question == null) throw new IllegalArgumentException("question은 필수입니다.");
        this.question = question;
        this.answerText = answerText;
        this.selectedChoiceIndex = selectedChoiceIndex;
        this.correct = correct;
        this.feedback = feedback;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public CsQuizQuestion getQuestion() {
        return question;
    }

    public String getAnswerText() {
        return answerText;
    }

    public Integer getSelectedChoiceIndex() {
        return selectedChoiceIndex;
    }

    public Boolean isCorrect() {
        return correct;
    }

    public CsQuizFeedback getFeedback() {
        return feedback;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

