package com.examSystem.service;

import com.examSystem.api.dto.CreateMcqQuestionRequest;
import com.examSystem.api.dto.CreateShortAnswerQuestionRequest;
import com.examSystem.model.McqQuestionEntity;
import com.examSystem.model.QuestionEntity;
import com.examSystem.model.ShortAnswerQuestionEntity;
import com.examSystem.repo.ExamRepository;
import com.examSystem.repo.QuestionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionManagementService {
    private final QuestionRepository questions;
    private final ExamRepository exams;

    public QuestionManagementService(QuestionRepository questions, ExamRepository exams) {
        this.questions = questions;
        this.exams = exams;
    }

    public QuestionEntity createMcq(CreateMcqQuestionRequest req) {
        validateCorrectIndex(req.correctIndex(), req.options().size());
        var subjectCode = req.subjectCode().trim();
        var text = req.text().trim();
        if (questions.existsBySubjectCodeIgnoreCaseAndTextIgnoreCase(subjectCode, text)) {
            throw new IllegalArgumentException("Same question already exists for subject code: " + subjectCode);
        }
        var entity = new McqQuestionEntity(
                req.questionCode().trim(),
                subjectCode,
                text,
                req.marks(),
                toJsonArray(req.options()),
                req.correctIndex()
        );
        if (req.examId() != null && !req.examId().isBlank()) {
            var exam = exams.findById(req.examId().trim()).orElseThrow(() -> new IllegalArgumentException("Exam not found: " + req.examId()));
            entity.setExam(exam);
        }
        return questions.save(entity);
    }

    public QuestionEntity createShort(CreateShortAnswerQuestionRequest req) {
        var subjectCode = req.subjectCode().trim();
        var text = req.text().trim();
        if (questions.existsBySubjectCodeIgnoreCaseAndTextIgnoreCase(subjectCode, text)) {
            throw new IllegalArgumentException("Same question already exists for subject code: " + subjectCode);
        }
        var entity = new ShortAnswerQuestionEntity(
                req.questionCode().trim(),
                subjectCode,
                text,
                req.marks(),
                req.expectedAnswer().trim()
        );
        if (req.examId() != null && !req.examId().isBlank()) {
            var exam = exams.findById(req.examId().trim()).orElseThrow(() -> new IllegalArgumentException("Exam not found: " + req.examId()));
            entity.setExam(exam);
        }
        return questions.save(entity);
    }

    public List<QuestionEntity> list(String subjectCode, String examId) {
        if (subjectCode != null && !subjectCode.isBlank()) {
            return questions.findBySubjectCodeIgnoreCase(subjectCode.trim());
        }
        if (examId != null && !examId.isBlank()) {
            return questions.findByExamExamIdIgnoreCase(examId.trim());
        }
        return questions.findAll();
    }

    public QuestionEntity get(Long id) {
        return questions.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + id));
    }

    public QuestionEntity updateMcq(Long id, CreateMcqQuestionRequest req) {
        validateCorrectIndex(req.correctIndex(), req.options().size());
        var entity = questions.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + id));
        if (!(entity instanceof McqQuestionEntity mcq)) {
            throw new IllegalArgumentException("Question is not MCQ: " + id);
        }
        applyCommonFields(mcq, req.questionCode(), req.subjectCode(), req.text(), req.marks(), req.examId());
        mcq.setOptionsJson(toJsonArray(req.options()));
        mcq.setCorrectIndex(req.correctIndex());
        return questions.save(mcq);
    }

    public QuestionEntity updateShort(Long id, CreateShortAnswerQuestionRequest req) {
        var entity = questions.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + id));
        if (!(entity instanceof ShortAnswerQuestionEntity shortQ)) {
            throw new IllegalArgumentException("Question is not short answer: " + id);
        }
        applyCommonFields(shortQ, req.questionCode(), req.subjectCode(), req.text(), req.marks(), req.examId());
        shortQ.setExpectedAnswer(req.expectedAnswer().trim());
        return questions.save(shortQ);
    }

    private void applyCommonFields(QuestionEntity entity, String questionCode, String subjectCode, String text, int marks, String examId) {
        entity.setQuestionCode(questionCode.trim());
        entity.setSubjectCode(subjectCode.trim());
        entity.setText(text.trim());
        entity.setMarks(marks);
        if (examId != null && !examId.isBlank()) {
            var exam = exams.findById(examId.trim())
                    .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));
            entity.setExam(exam);
        } else {
            entity.setExam(null);
        }
    }

    public void delete(Long id) {
        if (!questions.existsById(id)) {
            throw new IllegalArgumentException("Question not found: " + id);
        }
        questions.deleteById(id);
    }

    private static void validateCorrectIndex(int correctIndex, int optionCount) {
        if (correctIndex < 1 || correctIndex > optionCount) {
            throw new IllegalArgumentException(
                    "Correct answer must be between 1 and " + optionCount + " (number of options)");
        }
    }

    // Minimal JSON encoding to avoid extra deps
    private static String toJsonArray(List<String> values) {
        StringBuilder sb = new StringBuilder();
        sb.append('[');
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append('"').append(escapeJson(values.get(i))).append('"');
        }
        sb.append(']');
        return sb.toString();
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}

