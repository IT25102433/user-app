package com.examSystem.service;

import com.examSystem.model.Exam;
import com.examSystem.model.Question;
import com.examSystem.util.FileHandler;

import java.util.ArrayList;
import java.util.List;

public class ExamService {
    private static final String EXAM_FILE = "backend/data/exams.txt";
    private static final String QUESTION_FILE = "backend/data/questions.txt";

    public void createExam(Exam exam) {
        FileHandler.writeToFile(EXAM_FILE, exam.toString());
    }

    public List<String> getAllExams() {
        return FileHandler.readFromFile(EXAM_FILE);
    }

    public void addQuestion(Question q) {
        FileHandler.writeToFile(QUESTION_FILE, q.getQuestionId() + "," + q.getText() + "," + q.getMarks() + "," + q.getType());
    }

    public List<String> getAllQuestions() {
        return FileHandler.readFromFile(QUESTION_FILE);
    }

    public void updateExamDuration(String examId, int newDuration) {
        List<String> exams = FileHandler.readFromFile(EXAM_FILE);
        List<String> updated = new ArrayList<>();
        for (String e : exams) {
            String[] parts = e.split(",");
            if (parts[0].equals(examId)) {
                updated.add(parts[0] + "," + parts[1] + "," + newDuration);
            } else {
                updated.add(e);
            }
        }
        FileHandler.writeListToFile(EXAM_FILE, updated);
    }

    public void deleteExam(String examId) {
        List<String> exams = FileHandler.readFromFile(EXAM_FILE);
        exams.removeIf(e -> e.startsWith(examId + ","));
        FileHandler.writeListToFile(EXAM_FILE, exams);
    }
}
