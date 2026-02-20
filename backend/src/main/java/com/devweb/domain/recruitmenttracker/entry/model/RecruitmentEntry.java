package com.devweb.domain.recruitmenttracker.entry.model;

import com.devweb.domain.member.model.Member;
import jakarta.persistence.*;

import java.time.LocalDate;

/**
 * "지원 건(지원 이력의 한 카드/레코드)"을 나타내는 엔티티.
 */
@Entity
@Table(name = "job_applications")
public class RecruitmentEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecruitmentStep step;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlatformType platformType;

    @Column
    private String externalId;

    /**
     * 사용자가 입력한 "지원일"(지원한 날짜).
     * - 초기에는 스키마 마이그레이션 없이 진화하는 단계라 nullable로 두고,
     *   신규 생성 시점에는 기본값(LocalDate.now())을 채운다.
     */
    @Column
    private LocalDate appliedDate;

    protected RecruitmentEntry() {
    }

    public RecruitmentEntry(
            Member member,
            String companyName,
            String position,
            RecruitmentStep step,
            PlatformType platformType,
            String externalId
    ) {
        this(member, companyName, position, step, platformType, externalId, null);
    }

    public RecruitmentEntry(
            Member member,
            String companyName,
            String position,
            RecruitmentStep step,
            PlatformType platformType,
            String externalId,
            LocalDate appliedDate
    ) {
        if (member == null) throw new IllegalArgumentException("member는 필수입니다.");
        if (companyName == null || companyName.isBlank()) throw new IllegalArgumentException("companyName은 필수입니다.");
        if (position == null || position.isBlank()) throw new IllegalArgumentException("position은 필수입니다.");

        this.member = member;
        this.companyName = companyName;
        this.position = position;
        this.step = (step == null) ? RecruitmentStep.READY : step;
        this.platformType = (platformType == null) ? PlatformType.MANUAL : platformType;
        this.externalId = externalId;
        this.appliedDate = appliedDate;
    }

    @PrePersist
    void prePersist() {
        if (this.appliedDate == null) {
            this.appliedDate = LocalDate.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Member getMember() {
        return member;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getPosition() {
        return position;
    }

    public RecruitmentStep getStep() {
        return step;
    }

    public PlatformType getPlatformType() {
        return platformType;
    }

    public String getExternalId() {
        return externalId;
    }

    public LocalDate getAppliedDate() {
        return appliedDate;
    }

    public void changeAppliedDate(LocalDate newAppliedDate) {
        if (newAppliedDate == null) throw new IllegalArgumentException("appliedDate는 null일 수 없습니다.");
        this.appliedDate = newAppliedDate;
    }

    public void changeStep(RecruitmentStep newStep) {
        if (newStep == null) throw new IllegalArgumentException("step은 null일 수 없습니다.");
        this.step = newStep;
    }

    public void updateApplicationInfo(String companyName, String position) {
        if (companyName == null || companyName.isBlank()) throw new IllegalArgumentException("companyName은 필수입니다.");
        if (position == null || position.isBlank()) throw new IllegalArgumentException("position은 필수입니다.");
        this.companyName = companyName;
        this.position = position;
    }

    public void linkExternal(String externalId, PlatformType platformType) {
        this.externalId = externalId;
        if (platformType != null) {
            this.platformType = platformType;
        }
    }
}


