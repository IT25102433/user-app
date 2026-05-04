package com.examSystem.model;

public class ShortAnswerQuestion extends Question {
    private String expectedAnswer;

    public ShortAnswerQuestion(String id, String text, int marks, String expectedAnswer) {
        super(id, text, marks);
        this.expectedAnswer = expectedAnswer;
    }

    @Override
    public String getType() {
        return "ShortAnswer";
    }

    public String getExpectedAnswer() { return expectedAnswer; }
}
