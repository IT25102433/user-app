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
        if (req.correctIndex() < 0 || req.correctIndex() >= req.options().size()) {
            throw new IllegalArgumentException("correctIndex out of range");
        }
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

    public void delete(Long id) {
        if (!questions.existsById(id)) {
            throw new IllegalArgumentException("Question not found: " + id);
        }
        questions.deleteById(id);
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

