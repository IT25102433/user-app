package com.examSystem.model;

import java.util.ArrayList;
import java.util.List;

public class Exam {
    private String examId;
    private String subjectCode;
    private int duration; // in minutes
    private List<Question> questions;

    public Exam(String examId, String subjectCode, int duration) {
        this.examId = examId;
        this.subjectCode = subjectCode;
        this.duration = duration;
        this.questions = new ArrayList<>();
    }

    public String getExamId() { return examId; }
    public String getSubjectCode() { return subjectCode; }
    public int getDuration() { return duration; }
    public List<Question> getQuestions() { return questions; }

    public void addQuestion(Question q) {
        questions.add(q);
    }

    @Override
    public String toString() {
        return examId + "," + subjectCode + "," + duration;
    }
}
