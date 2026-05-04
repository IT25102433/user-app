package com.examSystem.controller;

import com.examSystem.model.Exam;
import com.examSystem.service.ExamService;

public class ExamController {
    private ExamService examService = new ExamService();

    public void createExam(String id, String subject, int duration) {
        Exam exam = new Exam(id, subject, duration);
        examService.createExam(exam);
        System.out.println("Exam created: " + exam);
    }

    public void listExams() {
        examService.getAllExams().forEach(System.out::println);
    }

    public void deleteExam(String id) {
        examService.deleteExam(id);
        System.out.println("Exam deleted: " + id);
    }
}
