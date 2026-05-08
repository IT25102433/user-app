package com.examSystem.model;

import java.util.List;

public class MCQQuestion extends Question {
    private List<String> options;
    private int correctOptionIndex;

    public MCQQuestion(String id, String text, int marks, List<String> options, int correctOptionIndex) {
        super(id, text, marks);
        this.options = options;
        this.correctOptionIndex = correctOptionIndex;
    }

    @Override
    public String getType() {
        return "MCQ";
    }

    public List<String> getOptions() { return options; }
    public int getCorrectOptionIndex() { return correctOptionIndex; }
}
