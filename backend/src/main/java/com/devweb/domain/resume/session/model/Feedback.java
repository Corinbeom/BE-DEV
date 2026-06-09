package com.devweb.domain.resume.session.model;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Embeddable
public class Feedback {

    @ElementCollection
    @CollectionTable(name = "resume_feedback_strengths", joinColumns = @JoinColumn(name = "attempt_id"))
    @Column(name = "strength", length = 2000)
    @OrderColumn(name = "idx")
    private List<String> strengths = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "resume_feedback_improvements", joinColumns = @JoinColumn(name = "attempt_id"))
    @Column(name = "improvement", length = 2000)
    @OrderColumn(name = "idx")
    private List<String> improvements = new ArrayList<>();

    @Lob
    @Column(name = "suggested_answer")
    private String suggestedAnswer;

    @ElementCollection
    @CollectionTable(name = "resume_feedback_followups", joinColumns = @JoinColumn(name = "attempt_id"))
    @Column(name = "followup", length = 2000)
    @OrderColumn(name = "idx")
    private List<String> followups = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "resume_feedback_delivery_strengths", joinColumns = @JoinColumn(name = "attempt_id"))
    @Column(name = "delivery_strength", length = 2000)
    @OrderColumn(name = "idx")
    private List<String> deliveryStrengths = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "resume_feedback_delivery_improvements", joinColumns = @JoinColumn(name = "attempt_id"))
    @Column(name = "delivery_improvement", length = 2000)
    @OrderColumn(name = "idx")
    private List<String> deliveryImprovements = new ArrayList<>();

    protected Feedback() {
    }

    public Feedback(List<String> strengths, List<String> improvements, String suggestedAnswer, List<String> followups) {
        this(strengths, improvements, suggestedAnswer, followups, null, null);
    }

    public Feedback(List<String> strengths, List<String> improvements, String suggestedAnswer, List<String> followups,
                    List<String> deliveryStrengths, List<String> deliveryImprovements) {
        if (strengths != null) this.strengths = new ArrayList<>(strengths);
        if (improvements != null) this.improvements = new ArrayList<>(improvements);
        this.suggestedAnswer = suggestedAnswer;
        if (followups != null) this.followups = new ArrayList<>(followups);
        if (deliveryStrengths != null) this.deliveryStrengths = new ArrayList<>(deliveryStrengths);
        if (deliveryImprovements != null) this.deliveryImprovements = new ArrayList<>(deliveryImprovements);
    }

    public List<String> getStrengths() {
        return Collections.unmodifiableList(strengths);
    }

    public List<String> getImprovements() {
        return Collections.unmodifiableList(improvements);
    }

    public String getSuggestedAnswer() {
        return suggestedAnswer;
    }

    public List<String> getFollowups() {
        return Collections.unmodifiableList(followups);
    }

    public List<String> getDeliveryStrengths() {
        return Collections.unmodifiableList(deliveryStrengths);
    }

    public List<String> getDeliveryImprovements() {
        return Collections.unmodifiableList(deliveryImprovements);
    }
}

