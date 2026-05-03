package com.devweb.domain.speechinterview.model;

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

    @Lob
    @Column(nullable = false)
    private String answerText;

    /** 행동 분석 지표 (카메라 OFF 시 null) */
    @Column
    private Double eyeContactRatio;

    @Column
    private Double postureStability;

    @Column
    private Double expressionVariety;

    @Column
    private Double fidgetingScore;

    @Embedded
    private SpeechAnswerFeedback feedback;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FeedbackStatus feedbackStatus;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected SpeechInterviewAnswer() {
    }

    public SpeechInterviewAnswer(String answerText, Double eyeContactRatio, Double postureStability,
                                  Double expressionVariety, Double fidgetingScore) {
        if (answerText == null || answerText.isBlank()) throw new IllegalArgumentException("answerText는 필수입니다.");
        this.answerText = answerText;
        this.eyeContactRatio = eyeContactRatio;
        this.postureStability = postureStability;
        this.expressionVariety = expressionVariety;
        this.fidgetingScore = fidgetingScore;
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
    public Double getEyeContactRatio() { return eyeContactRatio; }
    public Double getPostureStability() { return postureStability; }
    public Double getExpressionVariety() { return expressionVariety; }
    public Double getFidgetingScore() { return fidgetingScore; }
    public SpeechAnswerFeedback getFeedback() { return feedback; }
    public FeedbackStatus getFeedbackStatus() { return feedbackStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
