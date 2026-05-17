package com.examSystem.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "results")

@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
public abstract class Result {

    //Fields

    @Id
    private String  id;// UUID (from Supabase)
    @Column(name = "student_id")
    private String  studentId;    // e.g. "STU-001"
    @Column(name = "exam_id")
    private String  examId;       // e.g. "EXAM-2024-001"
    @Column(name = "mcq_score")
    private int     mcqScore;     // Auto-graded MCQ score
    @Column(name = "essay_score")
    private int     essayScore;   // Manually graded by teacher
    @Column(name = "total_score", insertable = false, updatable = false)
    private int     totalScore;   // Calculated: mcqScore + essayScore
    @Column(name = "result_status")
    private String  resultStatus; // "INTERNAL" or "FINAL"
    @Column(name = "feedback")
    private String  feedback;     // Teacher's written feedback
    private LocalDateTime submittedAt;
    private LocalDateTime updatedAt;

    //Constructors

    // Default constructor (needed for JSON deserialization)
    public Result() {
        this.id          = UUID.randomUUID().toString();
        this.submittedAt = LocalDateTime.now();
        this.updatedAt   = LocalDateTime.now();
    }

    // Full constructor used when creating a new result from a submission
    public Result(String studentId, String examId, int mcqScore, int essayScore) {
        this();
        this.studentId  = studentId;
        this.examId     = examId;
        this.mcqScore   = mcqScore;
        this.essayScore = essayScore;
        this.totalScore = calculateTotal(mcqScore, essayScore);
    }

    //Core Calculation Logic

    /**
     * Calculates the total score.
     * Kept in the base class so ALL result types use the same formula.
     */
    protected int calculateTotal(int mcq, int essay) {
        return mcq + essay;
    }

    /**
     * Returns a percentage score out of a given maximum.
     * Example: getPercentage(100) when totalScore=85 → returns 85.0
     */
    public double getPercentage(int maxScore) {
        if (maxScore <= 0) return 0.0;
        return ((double) totalScore / maxScore) * 100.0;
    }

    /**
     * Returns a letter grade based on percentage.
     * A=90+, B=75+, C=60+, D=50+, F=below 50
     */
    public String getLetterGrade(int maxScore) {
        double pct = getPercentage(maxScore);
        if (pct >= 90) return "A";
        if (pct >= 75) return "B";
        if (pct >= 60) return "C";
        if (pct >= 50) return "D";
        return "F";
    }

    /**
     * Recalculates totalScore whenever essay score is updated by a teacher.
     * Always call this after setEssayScore().
     */
    public void recalculateTotal() {
        this.totalScore = calculateTotal(this.mcqScore, this.essayScore);
        this.updatedAt  = LocalDateTime.now();
    }

    /**
     * ABSTRACT — Each subclass defines how its status is labeled.
     * InternalResult → "Pending Review"
     * FinalResult    → "Published"
     */
    public abstract String getStatusLabel();

    /**
     * ABSTRACT — Controls whether a student can see this result.
     * InternalResult → false   (teacher-only)
     * FinalResult    → true    (visible to student)
     */
    public abstract boolean isVisibleToStudent();

    //Getters & Setters

    public String getId()                       { return id; }
    public void   setId(String id)              { this.id = id; }

    public String getStudentId()                { return studentId; }
    public void   setStudentId(String sid)      { this.studentId = sid; }

    public String getExamId()                   { return examId; }
    public void   setExamId(String eid)         { this.examId = eid; }

    public int    getMcqScore()                 { return mcqScore; }
    public void   setMcqScore(int s)            { this.mcqScore = s; recalculateTotal(); }

    public int    getEssayScore()               { return essayScore; }
    public void   setEssayScore(int s)          { this.essayScore = s; recalculateTotal(); }

    public int    getTotalScore()               { return totalScore; }

    public String getResultStatus()             { return resultStatus; }
    public void   setResultStatus(String rs)    { this.resultStatus = rs; }

    public String getFeedback()                 { return feedback; }
    public void   setFeedback(String fb)        { this.feedback = fb; }

    public LocalDateTime getSubmittedAt()       { return submittedAt; }
    public void          setSubmittedAt(LocalDateTime t) { this.submittedAt = t; }

    public LocalDateTime getUpdatedAt()         { return updatedAt; }
    public void          setUpdatedAt(LocalDateTime t)   { this.updatedAt = t; }

    //toString (useful for logging)

    @Override
    public String toString() {
        return String.format(
                "Result{id='%s', student='%s', exam='%s', total=%d, status='%s'}",
                id, studentId, examId, totalScore, resultStatus
        );
    }
}

