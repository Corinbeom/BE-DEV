package com.devweb.domain.speechinterview.model;

import com.devweb.domain.member.model.Member;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "speech_interview_sessions")
public class SpeechInterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 50)
    private String positionType;

    /** 원본 ResumeSession 참조 (FK 없이 Long만 저장 — 독립성 보장) */
    @Column(name = "source_resume_session_id")
    private Long sourceResumeSessionId;

    @Column(nullable = false)
    private boolean useCamera;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SpeechInterviewStatus status;

    @Lob
    @Column(name = "resume_context")
    private String resumeContext;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime completedAt;

    @BatchSize(size = 50)
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<SpeechInterviewQuestion> questions = new ArrayList<>();

    protected SpeechInterviewSession() {
    }

    public SpeechInterviewSession(Member member, String title, String positionType,
                                   Long sourceResumeSessionId, boolean useCamera) {
        if (member == null) throw new IllegalArgumentException("member는 필수입니다.");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title은 필수입니다.");
        this.member = member;
        this.title = title;
        this.positionType = positionType;
        this.sourceResumeSessionId = sourceResumeSessionId;
        this.useCamera = useCamera;
        this.status = SpeechInterviewStatus.CREATED;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void addQuestion(SpeechInterviewQuestion question) {
        question.attachTo(this);
        this.questions.add(question);
    }

    public void storeResumeContext(String context) {
        this.resumeContext = context;
    }

    public void startInterview() {
        if (this.status != SpeechInterviewStatus.CREATED) {
            throw new IllegalStateException("CREATED 상태에서만 시작할 수 있습니다. 현재=" + this.status);
        }
        this.status = SpeechInterviewStatus.IN_PROGRESS;
    }

    public void complete() {
        this.status = SpeechInterviewStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Member getMember() { return member; }
    public String getTitle() { return title; }
    public String getPositionType() { return positionType; }
    public Long getSourceResumeSessionId() { return sourceResumeSessionId; }
    public boolean isUseCamera() { return useCamera; }
    public SpeechInterviewStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public String getResumeContext() { return resumeContext; }
    public List<SpeechInterviewQuestion> getQuestions() { return Collections.unmodifiableList(questions); }
}
