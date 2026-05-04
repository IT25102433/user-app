package com.examSystem.service;

import com.examSystem.api.dto.CreateExamRequest;
import com.examSystem.api.dto.UpdateExamRequest;
import com.examSystem.model.ExamEntity;
import com.examSystem.repo.ExamRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExamManagementService {
    private final ExamRepository exams;

    public ExamManagementService(ExamRepository exams) {
        this.exams = exams;
    }

    public ExamEntity create(CreateExamRequest req) {
        if (exams.existsById(req.examId())) {
            throw new IllegalArgumentException("Exam already exists: " + req.examId());
        }
        var status = (req.status() == null || req.status().isBlank()) ? "Draft" : req.status().trim();
        var grace = req.graceMinutes() == null ? 10 : Math.max(0, req.graceMinutes());
        var passCriteria = req.passCriteriaPercent() == null ? 40 : Math.max(0, Math.min(100, req.passCriteriaPercent()));
        var entity = new ExamEntity(req.examId().trim(), req.subjectCode().trim(), req.durationMinutes(), req.totalMarks(), status, grace, passCriteria);
        return exams.save(entity);
    }

    public List<ExamEntity> list() {
        return exams.findAll();
    }

    public ExamEntity get(String examId) {
        return exams.findById(examId).orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));
    }

    public ExamEntity update(String examId, UpdateExamRequest req) {
        var entity = get(examId);
        if (req.subjectCode() != null && !req.subjectCode().isBlank()) entity.setSubjectCode(req.subjectCode().trim());
        if (req.graceMinutes() != null) entity.setGraceMinutes(Math.max(0, req.graceMinutes()));
        if (req.passCriteriaPercent() != null) entity.setPassCriteriaPercent(Math.max(0, Math.min(100, req.passCriteriaPercent())));
        if (req.durationMinutes() != null) entity.setDurationMinutes(req.durationMinutes());
        if (req.totalMarks() != null) entity.setTotalMarks(req.totalMarks());
        if (req.status() != null && !req.status().isBlank()) entity.setStatus(req.status().trim());
        return exams.save(entity);
    }

    public void delete(String examId) {
        if (!exams.existsById(examId)) {
            throw new IllegalArgumentException("Exam not found: " + examId);
        }
        exams.deleteById(examId);
    }
}

