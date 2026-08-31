package com.examSystem.controller;

import com.examSystem.model.Submission;
import com.examSystem.service.SubmissionService;
public class SubmissionController {
    private SubmissionService submissionService;
    public SubmissionController() {
        this.submissionService = new SubmissionService();
    }
    public Submission submitExam(Submission submission) {
        return submissionService.submitExam(submission);
    }
}
