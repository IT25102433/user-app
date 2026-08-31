package com.examSystem.service;

import com.examSystem.model.Submission;
public class SubmissionService {
    public Submission submitExam(Submission submission) {
        System.out.println("✅ Exam successfully saved for student: " + submission.getStudentId());
        return submission;
    }
}