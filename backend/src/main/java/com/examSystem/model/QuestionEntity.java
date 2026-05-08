package com.examSystem.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "questions")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "question_type")
public abstract class QuestionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "question_code", length = 64, nullable = false)
    private String questionCode;

    @NotBlank
    @Column(name = "subject_code", length = 32, nullable = false)
    private String subjectCode;

    @NotBlank
    @Column(name = "text", columnDefinition = "TEXT", nullable = false)
    private String text;

    @Min(1)
    @Column(name = "marks", nullable = false)
    private int marks;

    @ManyToOne
    @JoinColumn(name = "exam_id")
    private ExamEntity exam;

    protected QuestionEntity() {}

    protected QuestionEntity(String questionCode, String subjectCode, String text, int marks) {
        this.questionCode = questionCode;
        this.subjectCode = subjectCode;
        this.text = text;
        this.marks = marks;
    }

    public Long getId() {
        return id;
    }

    public String getQuestionCode() {
        return questionCode;
    }

    public void setQuestionCode(String questionCode) {
        this.questionCode = questionCode;
    }

    public String getSubjectCode() {
        return subjectCode;
    }

    public void setSubjectCode(String subjectCode) {
        this.subjectCode = subjectCode;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public int getMarks() {
        return marks;
    }

    public void setMarks(int marks) {
        this.marks = marks;
    }

    public ExamEntity getExam() {
        return exam;
    }

    public void setExam(ExamEntity exam) {
        this.exam = exam;
    }

    public abstract String getType();
}

