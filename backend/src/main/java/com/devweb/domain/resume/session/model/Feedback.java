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

    protected Feedback() {
    }

    public Feedback(List<String> strengths, List<String> improvements, String suggestedAnswer, List<String> followups) {
        if (strengths != null) this.strengths = new ArrayList<>(strengths);
        if (improvements != null) this.improvements = new ArrayList<>(improvements);
        this.suggestedAnswer = suggestedAnswer;
        if (followups != null) this.followups = new ArrayList<>(followups);
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
}

