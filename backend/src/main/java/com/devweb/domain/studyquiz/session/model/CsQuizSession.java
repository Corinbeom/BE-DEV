package com.devweb.domain.studyquiz.session.model;

import com.devweb.domain.member.model.Member;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "cs_quiz_sessions")
public class CsQuizSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CsQuizDifficulty difficulty;

    @BatchSize(size = 50)
    @ElementCollection
    @CollectionTable(name = "cs_quiz_session_topics", joinColumns = @JoinColumn(name = "session_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "topic", nullable = false, length = 30)
    private Set<CsQuizTopic> topics = new LinkedHashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CsQuizSessionStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @BatchSize(size = 50)
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<CsQuizQuestion> questions = new ArrayList<>();

    protected CsQuizSession() {
    }

    public CsQuizSession(Member member, String title, CsQuizDifficulty difficulty, Set<CsQuizTopic> topics) {
        if (member == null) throw new IllegalArgumentException("member는 필수입니다.");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title은 필수입니다.");
        if (difficulty == null) throw new IllegalArgumentException("difficulty는 필수입니다.");
        if (topics == null || topics.isEmpty()) throw new IllegalArgumentException("topics는 1개 이상 필요합니다.");
        this.member = member;
        this.title = title;
        this.difficulty = difficulty;
        this.topics = new LinkedHashSet<>(topics);
        this.status = CsQuizSessionStatus.CREATED;
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

    public void markQuestionsReady(List<CsQuizQuestion> questions) {
        if (questions == null || questions.isEmpty()) throw new IllegalArgumentException("questions는 1개 이상 필요합니다.");
        this.questions.clear();
        for (CsQuizQuestion q : questions) {
            q.attachTo(this);
            this.questions.add(q);
        }
        this.status = CsQuizSessionStatus.QUESTIONS_READY;
    }

    public void markFailed() {
        this.status = CsQuizSessionStatus.FAILED;
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

    public CsQuizDifficulty getDifficulty() {
        return difficulty;
    }

    public Set<CsQuizTopic> getTopics() {
        return Collections.unmodifiableSet(topics);
    }

    public CsQuizSessionStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<CsQuizQuestion> getQuestions() {
        return Collections.unmodifiableList(questions);
    }
}

