package com.devweb.domain.resume.model;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.resume.session.model.StoredFileRef;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResumeFileType fileType;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "storageKey", column = @Column(name = "storage_key", length = 500)),
            @AttributeOverride(name = "originalFilename", column = @Column(name = "original_filename", length = 300)),
            @AttributeOverride(name = "contentType", column = @Column(name = "content_type", length = 100)),
            @AttributeOverride(name = "sizeBytes", column = @Column(name = "size_bytes"))
    })
    private StoredFileRef storedFile;

    @Column(columnDefinition = "TEXT")
    private String extractedText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResumeExtractStatus extractStatus;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected Resume() {
    }

    public Resume(Member member, String title, ResumeFileType fileType) {
        if (member == null) throw new IllegalArgumentException("member는 필수입니다.");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title은 필수입니다.");
        if (fileType == null) throw new IllegalArgumentException("fileType은 필수입니다.");
        this.member = member;
        this.title = title;
        this.fileType = fileType;
        this.extractStatus = ResumeExtractStatus.PENDING;
    }

    @PrePersist
    void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Member getMember() {
        return member;
    }

    public String getTitle() {
        return title;
    }

    public ResumeFileType getFileType() {
        return fileType;
    }

    public StoredFileRef getStoredFile() {
        return storedFile;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public ResumeExtractStatus getExtractStatus() {
        return extractStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void attachFile(StoredFileRef storedFile) {
        if (storedFile == null) throw new IllegalArgumentException("storedFile은 필수입니다.");
        this.storedFile = storedFile;
    }

    public void markExtracted(String extractedText) {
        if (extractedText == null || extractedText.isBlank()) {
            throw new IllegalArgumentException("extractedText는 필수입니다.");
        }
        this.extractedText = extractedText;
        this.extractStatus = ResumeExtractStatus.EXTRACTED;
    }

    public void markExtractFailed() {
        this.extractStatus = ResumeExtractStatus.FAILED;
    }
}
