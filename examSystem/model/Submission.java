package com.examSystem.model;

import java.time.LocalDateTime;
import java.util.Map;
public class Submission {
    private String submissionId;
    private String examId;
    private String studentId;
    private Map<String, String> answers;
    private LocalDateTime submissionTime;
    private double totalScore;
    private String status;
    public Submission() {}
    public Submission(String submissionId, String examId, String studentId, Map<String, String> answers, LocalDateTime submissionTime) {
        this.submissionId = submissionId;
        this.examId = examId;
        this.studentId = studentId;
        this.answers = answers;
        this.submissionTime = submissionTime;
        this.status = "PENDING_GRADING";
    }
    public String getSubmissionId() { return submissionId; }
    public void setSubmissionId(String submissionId) { this.submissionId = submissionId; }
    public String getExamId() { return examId; }
    public void setExamId(String examId) { this.examId = examId; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public Map<String, String> getAnswers() { return answers; }
    public void setAnswers(Map<String, String> answers) { this.answers = answers; }
    public LocalDateTime getSubmissionTime() { return submissionTime; }
    public void setSubmissionTime(LocalDateTime submissionTime) { this.submissionTime = submissionTime; }
}
