package com.devweb.domain.recruitmenttracker.note.model;

import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentEntry;
import jakarta.persistence.*;

import java.time.Instant;

/**
 * 지원 건(RecruitmentEntry)에 달리는 메모(단순 텍스트 리스트).
 */
@Entity
@Table(name = "recruitment_entry_notes")
public class RecruitmentEntryNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entry_id", nullable = false)
    private RecruitmentEntry entry;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected RecruitmentEntryNote() {
    }

    public RecruitmentEntryNote(RecruitmentEntry entry, String content) {
        if (entry == null) throw new IllegalArgumentException("entry는 필수입니다.");
        validateContent(content);
        this.entry = entry;
        this.content = content.trim();
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (this.createdAt == null) this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public RecruitmentEntry getEntry() {
        return entry;
    }

    public String getContent() {
        return content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void updateContent(String content) {
        validateContent(content);
        this.content = content.trim();
    }

    private void validateContent(String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("content는 필수입니다.");
        }
    }
}


