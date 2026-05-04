package com.examSystem.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Entity
@DiscriminatorValue("MCQ")
public class McqQuestionEntity extends QuestionEntity {
    @NotBlank
    @Column(name = "options_json", columnDefinition = "TEXT")
    private String optionsJson;

    @Min(0)
    @Max(10_000)
    @Column(name = "correct_index")
    private int correctIndex;

    public McqQuestionEntity() {}

    public McqQuestionEntity(String questionCode, String subjectCode, String text, int marks, String optionsJson, int correctIndex) {
        super(questionCode, subjectCode, text, marks);
        this.optionsJson = optionsJson;
        this.correctIndex = correctIndex;
    }

    @Override
    public String getType() {
        return "MCQ";
    }

    public String getOptionsJson() {
        return optionsJson;
    }

    public void setOptionsJson(String optionsJson) {
        this.optionsJson = optionsJson;
    }

    public int getCorrectIndex() {
        return correctIndex;
    }

    public void setCorrectIndex(int correctIndex) {
        this.correctIndex = correctIndex;
    }
}

