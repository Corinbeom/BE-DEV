package com.bluehour.domain.speechinterview.model;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * SpeechInterviewAnswer 전용 피드백 ValueObject.
 * resume 도메인 Feedback과 동일 구조이나 speech 전용 테이블을 사용한다.
 */
@Embeddable
public class SpeechAnswerFeedback {

    @ElementCollection
    @CollectionTable(name = "speech_feedback_strengths", joinColumns = @JoinColumn(name = "answer_id"))
    @Column(name = "strength", length = 2000)
    @OrderColumn(name = "idx")
    private List<String> strengths = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "speech_feedback_improvements", joinColumns = @JoinColumn(name = "answer_id"))
    @Column(name = "improvement", length = 2000)
    @OrderColumn(name = "idx")
    private List<String> improvements = new ArrayList<>();

    @Column(name = "suggested_answer", columnDefinition = "text")
    private String suggestedAnswer;

    @ElementCollection
    @CollectionTable(name = "speech_feedback_followups", joinColumns = @JoinColumn(name = "answer_id"))
    @Column(name = "followup", length = 2000)
    @OrderColumn(name = "idx")
    private List<String> followups = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "speech_feedback_delivery_strengths", joinColumns = @JoinColumn(name = "answer_id"))
    @Column(name = "delivery_strength", length = 2000)
    @OrderColumn(name = "idx")
    private List<String> deliveryStrengths = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "speech_feedback_delivery_improvements", joinColumns = @JoinColumn(name = "answer_id"))
    @Column(name = "delivery_improvement", length = 2000)
    @OrderColumn(name = "idx")
    private List<String> deliveryImprovements = new ArrayList<>();

    protected SpeechAnswerFeedback() {
    }

    public SpeechAnswerFeedback(List<String> strengths, List<String> improvements, String suggestedAnswer,
                                 List<String> followups, List<String> deliveryStrengths, List<String> deliveryImprovements) {
        if (strengths != null) this.strengths = new ArrayList<>(strengths);
        if (improvements != null) this.improvements = new ArrayList<>(improvements);
        this.suggestedAnswer = suggestedAnswer;
        if (followups != null) this.followups = new ArrayList<>(followups);
        if (deliveryStrengths != null) this.deliveryStrengths = new ArrayList<>(deliveryStrengths);
        if (deliveryImprovements != null) this.deliveryImprovements = new ArrayList<>(deliveryImprovements);
    }

    public List<String> getStrengths() { return Collections.unmodifiableList(strengths); }
    public List<String> getImprovements() { return Collections.unmodifiableList(improvements); }
    public String getSuggestedAnswer() { return suggestedAnswer; }
    public List<String> getFollowups() { return Collections.unmodifiableList(followups); }
    public List<String> getDeliveryStrengths() { return Collections.unmodifiableList(deliveryStrengths); }
    public List<String> getDeliveryImprovements() { return Collections.unmodifiableList(deliveryImprovements); }
}
