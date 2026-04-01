package com.devweb.domain.resume.mail.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interview_mail_logs")
public class InterviewMailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "schedule_id", nullable = false)
    private InterviewMailSchedule schedule;

    @Column(nullable = false)
    private int questionCount;

    @Lob
    @Column(nullable = false)
    private String questionsJson;

    @Column(nullable = false)
    private LocalDateTime sentAt;

    protected InterviewMailLog() {
    }

    public InterviewMailLog(InterviewMailSchedule schedule, int questionCount,
                            String questionsJson) {
        if (schedule == null) throw new IllegalArgumentException("schedule은 필수입니다.");
        if (questionsJson == null || questionsJson.isBlank()) throw new IllegalArgumentException("questionsJson은 필수입니다.");
        this.schedule = schedule;
        this.questionCount = questionCount;
        this.questionsJson = questionsJson;
    }

    @PrePersist
    void prePersist() {
        if (this.sentAt == null) this.sentAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public InterviewMailSchedule getSchedule() { return schedule; }
    public int getQuestionCount() { return questionCount; }
    public String getQuestionsJson() { return questionsJson; }
    public LocalDateTime getSentAt() { return sentAt; }
}
