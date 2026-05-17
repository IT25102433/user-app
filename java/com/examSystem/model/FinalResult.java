package com.examSystem.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import java.time.LocalDateTime;


@Entity
@DiscriminatorValue("FINAL")

public class FinalResult extends Result {

    //Extra Fields (publication metadata)

    private String        publishedBy;  // Teacher ID who published this
    private LocalDateTime publishedAt;  // When it was published

    //Constructors

    public FinalResult() {
        super();
        this.setResultStatus("FINAL");
        this.publishedAt = LocalDateTime.now();
    }

    public FinalResult(String studentId, String examId, int mcqScore, int essayScore) {
        super(studentId, examId, mcqScore, essayScore);
        this.setResultStatus("FINAL");
        this.publishedAt = LocalDateTime.now();
    }

    //Polymorphic Overrides

    /**
     * Final results show "Published" in both teacher and student views.
     */
    @Override
    public String getStatusLabel() {
        return "Published";
    }

    /**
     * Final results ARE visible to the student.
     */
    @Override
    public boolean isVisibleToStudent() {
        return true;
    }

    //Student-facing Summary

    /**
     * Returns a clean summary string for the student dashboard.
     * Example: "EXAM-2024-001 | Score: 85 | Grade: B | Excellent work!"
     */
    public String toStudentSummary(int maxScore) {
        return String.format(
                "%s | Score: %d | Grade: %s | %s",
                getExamId(),
                getTotalScore(),
                getLetterGrade(maxScore),
                getFeedback() != null ? getFeedback() : "No feedback provided."
        );
    }

    // Getters & Setters

    public String        getPublishedBy()               { return publishedBy; }
    public void          setPublishedBy(String t)       { this.publishedBy = t; }

    public LocalDateTime getPublishedAt()               { return publishedAt; }
    public void          setPublishedAt(LocalDateTime t){ this.publishedAt = t; }
}
