package com.devweb.domain.studyquiz.bank.model;

import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "cs_question_bank_items")
public class CsQuestionBankItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CsQuizTopic topic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CsQuizDifficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CsQuizQuestionType type;

    @Lob
    @Column(nullable = false)
    private String prompt;

    @ElementCollection
    @CollectionTable(name = "cs_question_bank_choices", joinColumns = @JoinColumn(name = "item_id"))
    @OrderColumn(name = "idx")
    @Column(name = "choice_text", length = 2000)
    private List<String> choices = new ArrayList<>();

    @Column(name = "correct_choice_index")
    private Integer correctChoiceIndex;

    @Lob
    @Column(name = "reference_answer")
    private String referenceAnswer;

    @ElementCollection
    @CollectionTable(name = "cs_question_bank_rubric_keywords", joinColumns = @JoinColumn(name = "item_id"))
    @OrderColumn(name = "idx")
    @Column(name = "keyword", length = 200)
    private List<String> rubricKeywords = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt;

    protected CsQuestionBankItem() {
    }

    public static CsQuestionBankItem multipleChoice(
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            String prompt,
            List<String> choices,
            int correctChoiceIndex,
            String referenceAnswer
    ) {
        if (choices == null || choices.size() < 2) throw new IllegalArgumentException("choices는 2개 이상이어야 합니다.");
        if (correctChoiceIndex < 0 || correctChoiceIndex >= choices.size()) {
            throw new IllegalArgumentException("correctChoiceIndex 범위가 올바르지 않습니다.");
        }
        CsQuestionBankItem item = new CsQuestionBankItem(topic, difficulty, CsQuizQuestionType.MULTIPLE_CHOICE, prompt);
        item.choices = new ArrayList<>(choices);
        item.correctChoiceIndex = correctChoiceIndex;
        item.referenceAnswer = referenceAnswer;
        return item;
    }

    public static CsQuestionBankItem shortAnswer(
            CsQuizTopic topic,
            CsQuizDifficulty difficulty,
            String prompt,
            List<String> rubricKeywords,
            String referenceAnswer
    ) {
        CsQuestionBankItem item = new CsQuestionBankItem(topic, difficulty, CsQuizQuestionType.SHORT_ANSWER, prompt);
        if (rubricKeywords != null) item.rubricKeywords = new ArrayList<>(rubricKeywords);
        item.referenceAnswer = referenceAnswer;
        return item;
    }

    private CsQuestionBankItem(CsQuizTopic topic, CsQuizDifficulty difficulty, CsQuizQuestionType type, String prompt) {
        if (topic == null) throw new IllegalArgumentException("topic은 필수입니다.");
        if (difficulty == null) throw new IllegalArgumentException("difficulty는 필수입니다.");
        if (type == null) throw new IllegalArgumentException("type은 필수입니다.");
        if (prompt == null || prompt.isBlank()) throw new IllegalArgumentException("prompt는 필수입니다.");
        this.topic = topic;
        this.difficulty = difficulty;
        this.type = type;
        this.prompt = prompt;
    }

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public CsQuizTopic getTopic() {
        return topic;
    }

    public CsQuizDifficulty getDifficulty() {
        return difficulty;
    }

    public CsQuizQuestionType getType() {
        return type;
    }

    public String getPrompt() {
        return prompt;
    }

    public List<String> getChoices() {
        return Collections.unmodifiableList(choices);
    }

    public Integer getCorrectChoiceIndex() {
        return correctChoiceIndex;
    }

    public String getReferenceAnswer() {
        return referenceAnswer;
    }

    public List<String> getRubricKeywords() {
        return Collections.unmodifiableList(rubricKeywords);
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

