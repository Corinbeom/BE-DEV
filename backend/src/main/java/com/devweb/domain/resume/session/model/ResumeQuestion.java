package com.devweb.domain.resume.session.model;

import com.devweb.domain.resume.model.InterviewQuestion;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "resume_questions")
public class ResumeQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private ResumeSession session;

    @Column(nullable = false)
    private int orderIndex;

    @Column(nullable = false, length = 100)
    private String badge;

    @Column(nullable = false)
    private int likelihood;

    @Embedded
    private InterviewQuestion interviewQuestion;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ResumeAnswerAttempt> attempts = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected ResumeQuestion() {
    }

    public ResumeQuestion(int orderIndex, String badge, int likelihood, InterviewQuestion interviewQuestion) {
        if (interviewQuestion == null) throw new IllegalArgumentException("interviewQuestion은 필수입니다.");
        if (badge == null || badge.isBlank()) throw new IllegalArgumentException("badge는 필수입니다.");
        if (likelihood < 0 || likelihood > 100) throw new IllegalArgumentException("likelihood는 0~100 입니다.");
        this.orderIndex = orderIndex;
        this.badge = badge;
        this.likelihood = likelihood;
        this.interviewQuestion = interviewQuestion;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    void attachTo(ResumeSession session) {
        if (session == null) throw new IllegalArgumentException("session은 필수입니다.");
        this.session = session;
    }

    public Long getId() {
        return id;
    }

    public ResumeSession getSession() {
        return session;
    }

    public int getOrderIndex() {
        return orderIndex;
    }

    public String getBadge() {
        return badge;
    }

    public int getLikelihood() {
        return likelihood;
    }

    public InterviewQuestion getInterviewQuestion() {
        return interviewQuestion;
    }

    public List<ResumeAnswerAttempt> getAttempts() {
        return Collections.unmodifiableList(attempts);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public ResumeAnswerAttempt addAttempt(String answerText, Feedback feedback) {
        ResumeAnswerAttempt attempt = new ResumeAnswerAttempt(this, answerText, feedback);
        this.attempts.add(attempt);
        return attempt;
    }
}

