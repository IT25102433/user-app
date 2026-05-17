package com.examSystem.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("INTERNAL")

public class InternalResult extends Result {

    //Extra Fields (teacher-only)

    private String  gradedBy;      // Teacher ID who last edited this result
    private String  gradingNotes;  // Internal notes (never shown to student)
    private boolean essayGraded;   // Has the teacher manually graded essay yet?

    //Constructors

    public InternalResult() {
        super();
        this.setResultStatus("INTERNAL");
        this.essayGraded = false;
    }

    public InternalResult(String studentId, String examId, int mcqScore, int essayScore) {
        super(studentId, examId, mcqScore, essayScore);
        this.setResultStatus("INTERNAL");
        this.essayGraded = false;
    }

    //Polymorphic Overrides

    /**
     * Internal results show "Pending Review" in the teacher's grading panel.
     */
    @Override
    public String getStatusLabel() {
        return essayGraded ? "Pending Review" : "Awaiting Essay Grade";
    }

    /**
     * Internal results are NEVER visible to the student.
     */
    @Override
    public boolean isVisibleToStudent() {
        return false;
    }

    //Teacher-specific Behaviour

    /**
     * Promotes this InternalResult to a FinalResult.
     * Called when a teacher clicks "Publish" in the grading panel.
     * Returns a new FinalResult object — does not modify this object.
     */
    public FinalResult publish(String teacherId) {
        FinalResult published = new FinalResult(
                this.getStudentId(),
                this.getExamId(),
                this.getMcqScore(),
                this.getEssayScore()
        );
        published.setId(this.getId());           // Keep the same DB row ID
        published.setFeedback(this.getFeedback());
        published.setSubmittedAt(this.getSubmittedAt());
        published.setPublishedBy(teacherId);
        return published;
    }

    /**
     * Marks the essay as graded and records who graded it.
     */
    public void markEssayGraded(String teacherId, int score, String notes) {
        this.setEssayScore(score);   // triggers recalculateTotal() in base class
        this.gradedBy     = teacherId;
        this.gradingNotes = notes;
        this.essayGraded  = true;
    }

    //Getters & Setters

    public String  getGradedBy()              { return gradedBy; }
    public void    setGradedBy(String t)      { this.gradedBy = t; }

    public String  getGradingNotes()          { return gradingNotes; }
    public void    setGradingNotes(String n)  { this.gradingNotes = n; }

    public boolean isEssayGraded()            { return essayGraded; }
    public void    setEssayGraded(boolean b)  { this.essayGraded = b; }
}
