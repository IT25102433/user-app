package com.examSystem.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

@Entity
@Table(name = "exams")
public class ExamEntity {
    @Id
    @Column(name = "exam_id", length = 64, nullable = false)
    private String examId;

    @NotBlank
    @Column(name = "subject_code", length = 32, nullable = false)
    private String subjectCode;

    @Min(1)
    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Min(0)
    @Column(name = "total_marks", nullable = false)
    private int totalMarks;

    @Column(name = "exam_date")
    private LocalDate examDate;

    @Min(0)
    @Column(name = "grace_minutes", nullable = false)
    private int graceMinutes = 10;

    @Min(0)
    @Max(100)
    @Column(name = "pass_criteria_percent", nullable = false)
    private int passCriteriaPercent = 40;

    public ExamEntity() {}

    public ExamEntity(String examId, String subjectCode, int durationMinutes, int totalMarks, LocalDate examDate, int graceMinutes, int passCriteriaPercent) {
        this.examId = examId;
        this.subjectCode = subjectCode;
        this.durationMinutes = durationMinutes;
        this.totalMarks = totalMarks;
        this.examDate = examDate;
        this.graceMinutes = Math.max(0, graceMinutes);
        this.passCriteriaPercent = Math.max(0, Math.min(100, passCriteriaPercent));
    }

    public String getExamId() {
        return examId;
    }

    public void setExamId(String examId) {
        this.examId = examId;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public void setSubjectCode(String subjectCode) {
        this.subjectCode = subjectCode;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public int getTotalMarks() {
        return totalMarks;
    }

    public void setTotalMarks(int totalMarks) {
        this.totalMarks = totalMarks;
    }

    public LocalDate getExamDate() {
        return examDate;
    }

    public void setExamDate(LocalDate examDate) {
        this.examDate = examDate;
    }

    public int getGraceMinutes() {
        return graceMinutes;
    }

    public void setGraceMinutes(int graceMinutes) {
        this.graceMinutes = graceMinutes;
    }

    public int getPassCriteriaPercent() {
        return passCriteriaPercent;
    }

    public void setPassCriteriaPercent(int passCriteriaPercent) {
        this.passCriteriaPercent = passCriteriaPercent;
    }
}

