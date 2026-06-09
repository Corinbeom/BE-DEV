package com.devweb.domain.speechinterview.model;

import jakarta.persistence.*;

@Entity
@Table(name = "speech_interview_questions")
public class SpeechInterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private SpeechInterviewSession session;

    @Column(nullable = false)
    private int orderIndex;

    @Column(nullable = false, length = 100)
    private String badge;

    @Column(nullable = false, columnDefinition = "text")
    private String questionText;

    @Column(columnDefinition = "text")
    private String intention;

    @Column(length = 500)
    private String keywords;

    @Column(columnDefinition = "text")
    private String modelAnswer;

    @OneToOne(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private SpeechInterviewAnswer answer;

    protected SpeechInterviewQuestion() {
    }

    public SpeechInterviewQuestion(int orderIndex, String badge, String questionText,
                                    String intention, String keywords, String modelAnswer) {
        if (badge == null || badge.isBlank()) throw new IllegalArgumentException("badge는 필수입니다.");
        if (questionText == null || questionText.isBlank()) throw new IllegalArgumentException("questionText는 필수입니다.");
        this.orderIndex = orderIndex;
        this.badge = badge;
        this.questionText = questionText;
        this.intention = intention;
        this.keywords = keywords;
        this.modelAnswer = modelAnswer;
    }

    void attachTo(SpeechInterviewSession session) {
        if (session == null) throw new IllegalArgumentException("session은 필수입니다.");
        this.session = session;
    }

    public void attachAnswer(SpeechInterviewAnswer answer) {
        this.answer = answer;
        answer.attachTo(this);
    }

    public Long getId() { return id; }
    public SpeechInterviewSession getSession() { return session; }
    public int getOrderIndex() { return orderIndex; }
    public String getBadge() { return badge; }
    public String getQuestionText() { return questionText; }
    public String getIntention() { return intention; }
    public String getKeywords() { return keywords; }
    public String getModelAnswer() { return modelAnswer; }
    public SpeechInterviewAnswer getAnswer() { return answer; }
}
