package com.bluehour.domain.speechinterview.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "speech_interview_answers")
public class SpeechInterviewAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false, unique = true)
    private SpeechInterviewQuestion question;

    @Column(nullable = false, columnDefinition = "text")
    private String answerText;

    @Embedded
    private SpeechAnswerFeedback feedback;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FeedbackStatus feedbackStatus;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected SpeechInterviewAnswer() {
    }

    public SpeechInterviewAnswer(String answerText) {
        if (answerText == null || answerText.isBlank()) throw new IllegalArgumentException("answerText는 필수입니다.");
        this.answerText = answerText;
        this.feedbackStatus = FeedbackStatus.PENDING;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    void attachTo(SpeechInterviewQuestion question) {
        this.question = question;
    }

    public void completeFeedback(SpeechAnswerFeedback feedback) {
        this.feedback = feedback;
        this.feedbackStatus = FeedbackStatus.COMPLETED;
    }

    public void failFeedback() {
        this.feedbackStatus = FeedbackStatus.FAILED;
    }

    public Long getId() { return id; }
    public SpeechInterviewQuestion getQuestion() { return question; }
    public String getAnswerText() { return answerText; }
    public SpeechAnswerFeedback getFeedback() { return feedback; }
    public FeedbackStatus getFeedbackStatus() { return feedbackStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
