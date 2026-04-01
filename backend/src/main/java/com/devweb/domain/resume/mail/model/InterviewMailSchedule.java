package com.devweb.domain.resume.mail.model;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.resume.model.Resume;
import com.devweb.domain.resume.session.model.PositionType;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "interview_mail_schedules")
public class InterviewMailSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false, unique = true)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PositionType positionType;

    @Column(nullable = false)
    private int sendHour;

    @Column(nullable = false)
    private boolean enabled;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "interview_mail_target_technologies",
            joinColumns = @JoinColumn(name = "schedule_id"))
    @Column(name = "technology", length = 100)
    private List<String> targetTechnologies = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    protected InterviewMailSchedule() {
    }

    public InterviewMailSchedule(Member member, Resume resume, PositionType positionType,
                                  int sendHour, boolean enabled, List<String> targetTechnologies) {
        if (member == null) throw new IllegalArgumentException("member는 필수입니다.");
        if (resume == null) throw new IllegalArgumentException("resume는 필수입니다.");
        if (positionType == null) throw new IllegalArgumentException("positionType은 필수입니다.");
        if (sendHour < 0 || sendHour > 23) throw new IllegalArgumentException("sendHour는 0~23이어야 합니다.");
        this.member = member;
        this.resume = resume;
        this.positionType = positionType;
        this.sendHour = sendHour;
        this.enabled = enabled;
        this.targetTechnologies = targetTechnologies != null ? new ArrayList<>(targetTechnologies) : new ArrayList<>();
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) this.createdAt = now;
        if (this.updatedAt == null) this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void update(Resume resume, PositionType positionType, int sendHour,
                       boolean enabled, List<String> targetTechnologies) {
        if (resume == null) throw new IllegalArgumentException("resume는 필수입니다.");
        if (positionType == null) throw new IllegalArgumentException("positionType은 필수입니다.");
        if (sendHour < 0 || sendHour > 23) throw new IllegalArgumentException("sendHour는 0~23이어야 합니다.");
        this.resume = resume;
        this.positionType = positionType;
        this.sendHour = sendHour;
        this.enabled = enabled;
        this.targetTechnologies = targetTechnologies != null ? new ArrayList<>(targetTechnologies) : new ArrayList<>();
    }

    public Long getId() { return id; }
    public Member getMember() { return member; }
    public Resume getResume() { return resume; }
    public PositionType getPositionType() { return positionType; }
    public int getSendHour() { return sendHour; }
    public boolean isEnabled() { return enabled; }
    public List<String> getTargetTechnologies() { return targetTechnologies; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
