package com.devweb.domain.resume.session.model;

import com.devweb.domain.member.model.Member;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "resume_sessions")
public class ResumeSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PositionType positionType;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String portfolioUrl;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "storageKey", column = @Column(name = "resume_storage_key", length = 500)),
            @AttributeOverride(name = "originalFilename", column = @Column(name = "resume_original_filename", length = 300)),
            @AttributeOverride(name = "contentType", column = @Column(name = "resume_content_type", length = 100)),
            @AttributeOverride(name = "sizeBytes", column = @Column(name = "resume_size_bytes"))
    })
    private StoredFileRef resumeFile;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "storageKey", column = @Column(name = "portfolio_storage_key", length = 500)),
            @AttributeOverride(name = "originalFilename", column = @Column(name = "portfolio_original_filename", length = 300)),
            @AttributeOverride(name = "contentType", column = @Column(name = "portfolio_content_type", length = 100)),
            @AttributeOverride(name = "sizeBytes", column = @Column(name = "portfolio_size_bytes"))
    })
    private StoredFileRef portfolioFile;

    @Lob
    @Column
    private String resumeText;

    @Lob
    @Column
    private String portfolioText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ResumeSessionStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<ResumeQuestion> questions = new ArrayList<>();

    protected ResumeSession() {
    }

    public ResumeSession(Member member, PositionType positionType, String title, String portfolioUrl) {
        if (member == null) throw new IllegalArgumentException("member는 필수입니다.");
        if (positionType == null) throw new IllegalArgumentException("positionType은 필수입니다.");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title은 필수입니다.");
        this.member = member;
        this.positionType = positionType;
        this.title = title;
        this.portfolioUrl = portfolioUrl;
        this.status = ResumeSessionStatus.CREATED;
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Member getMember() {
        return member;
    }

    public PositionType getPositionType() {
        return positionType;
    }

    public String getTitle() {
        return title;
    }

    public String getPortfolioUrl() {
        return portfolioUrl;
    }

    public StoredFileRef getResumeFile() {
        return resumeFile;
    }

    public StoredFileRef getPortfolioFile() {
        return portfolioFile;
    }

    public String getResumeText() {
        return resumeText;
    }

    public String getPortfolioText() {
        return portfolioText;
    }

    public ResumeSessionStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<ResumeQuestion> getQuestions() {
        return Collections.unmodifiableList(questions);
    }

    public void attachFiles(StoredFileRef resumeFile, StoredFileRef portfolioFile) {
        if (resumeFile == null) throw new IllegalArgumentException("resumeFile은 필수입니다.");
        this.resumeFile = resumeFile;
        this.portfolioFile = portfolioFile;
    }

    public void markExtracted(String resumeText, String portfolioText) {
        if (resumeText == null || resumeText.isBlank()) throw new IllegalArgumentException("resumeText는 필수입니다.");
        this.resumeText = resumeText;
        this.portfolioText = portfolioText;
        this.status = ResumeSessionStatus.EXTRACTED;
    }

    public void markQuestionsReady(List<ResumeQuestion> questions) {
        if (questions == null || questions.isEmpty()) throw new IllegalArgumentException("questions는 필수입니다.");
        this.questions.clear();
        for (ResumeQuestion q : questions) {
            q.attachTo(this);
            this.questions.add(q);
        }
        this.status = ResumeSessionStatus.QUESTIONS_READY;
    }

    public void markFailed() {
        this.status = ResumeSessionStatus.FAILED;
    }
}

