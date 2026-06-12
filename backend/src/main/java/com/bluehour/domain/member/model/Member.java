package com.bluehour.domain.member.model;

import com.bluehour.common.StringListConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "members")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "oauth_provider")
    private String oauthProvider;

    @Column(name = "oauth_subject")
    private String oauthSubject;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "photo_url", length = 1024)
    private String photoUrl;

    @Lob
    @Column(name = "coaching_report_json")
    private String coachingReportJson;

    @Column(name = "coaching_report_generated_at")
    private LocalDateTime coachingReportGeneratedAt;

    @Convert(converter = StringListConverter.class)
    @Column(name = "target_roles", columnDefinition = "text")
    private List<String> targetRoles = new ArrayList<>();

    @Column(name = "onboarding_completed", nullable = false, columnDefinition = "boolean default false")
    private boolean onboardingCompleted = false;

    protected Member() {
    }

    public Member(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email은 필수입니다.");
        }
        this.email = email;
    }

    public Member(String email, String oauthProvider, String oauthSubject,
                  String displayName, String photoUrl) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email은 필수입니다.");
        }
        this.email = email;
        this.oauthProvider = oauthProvider;
        this.oauthSubject = oauthSubject;
        this.displayName = displayName;
        this.photoUrl = photoUrl;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getOauthProvider() {
        return oauthProvider;
    }

    public String getOauthSubject() {
        return oauthSubject;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public String getCoachingReportJson() {
        return coachingReportJson;
    }

    public void setCoachingReportJson(String coachingReportJson) {
        this.coachingReportJson = coachingReportJson;
    }

    public LocalDateTime getCoachingReportGeneratedAt() {
        return coachingReportGeneratedAt;
    }

    public void setCoachingReportGeneratedAt(LocalDateTime generatedAt) {
        this.coachingReportGeneratedAt = generatedAt;
    }

    public boolean canRegenerateCoachingReport() {
        if (coachingReportGeneratedAt == null) return true;
        return coachingReportGeneratedAt.isBefore(LocalDateTime.now().minusHours(24));
    }

    public List<String> getTargetRoles() {
        return Collections.unmodifiableList(targetRoles == null ? List.of() : targetRoles);
    }

    public boolean isOnboardingCompleted() {
        return onboardingCompleted;
    }

    public void completeOnboarding(List<String> targetRoles) {
        this.targetRoles = new ArrayList<>(targetRoles == null ? List.of() : targetRoles);
        this.onboardingCompleted = true;
    }
}
