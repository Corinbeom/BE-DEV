package com.devweb.domain.resume.model;

import com.devweb.domain.member.model.Member;
import jakarta.persistence.*;

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

    @Lob
    @Column
    private String extractedText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResumeExtractStatus extractStatus;

    protected Resume() {
    }

    public Resume(Member member, String title) {
        if (member == null) throw new IllegalArgumentException("member는 필수입니다.");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title은 필수입니다.");
        this.member = member;
        this.title = title;
        this.extractStatus = ResumeExtractStatus.PENDING;
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

    public String getExtractedText() {
        return extractedText;
    }

    public ResumeExtractStatus getExtractStatus() {
        return extractStatus;
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


