package com.devweb.domain.member.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

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
}
