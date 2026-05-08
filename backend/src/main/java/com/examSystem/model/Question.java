package com.examSystem.model;

public abstract class Question {
    private String questionId;
    private String text;
    private int marks;

    public Question(String questionId, String text, int marks) {
        this.questionId = questionId;
        this.text = text;
        this.marks = marks;
    }

    public String getQuestionId() { return questionId; }
    public String getText() { return text; }
    public int getMarks() { return marks; }

    public abstract String getType();
}
