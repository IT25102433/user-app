package com.examSystem.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.validation.constraints.NotBlank;

@Entity
@DiscriminatorValue("SHORT")
public class ShortAnswerQuestionEntity extends QuestionEntity {
    @NotBlank
    @Column(name = "expected_answer", columnDefinition = "TEXT")
    private String expectedAnswer;

    public ShortAnswerQuestionEntity() {}

    public ShortAnswerQuestionEntity(String questionCode, String subjectCode, String text, int marks, String expectedAnswer) {
        super(questionCode, subjectCode, text, marks);
        this.expectedAnswer = expectedAnswer;
    }

    @Override
    public String getType() {
        return "SHORT";
    }

    public String getExpectedAnswer() {
        return expectedAnswer;
    }

    public void setExpectedAnswer(String expectedAnswer) {
        this.expectedAnswer = expectedAnswer;
    }
}

