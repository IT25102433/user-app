package com.examSystem.api;

import com.examSystem.api.dto.CreateExamRequest;
import com.examSystem.api.dto.UpdateExamRequest;
import com.examSystem.model.ExamEntity;
import com.examSystem.service.ExamManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@CrossOrigin(origins = "http://localhost:5173")
public class ExamRestController {
    private final ExamManagementService service;

    public ExamRestController(ExamManagementService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExamEntity create(@Valid @RequestBody CreateExamRequest req) {
        return service.create(req);
    }

    @GetMapping
    public List<ExamEntity> list() {
        return service.list();
    }

    @GetMapping("/{examId}")
    public ExamEntity get(@PathVariable String examId) {
        return service.get(examId);
    }

    @PutMapping("/{examId}")
    public ExamEntity update(@PathVariable String examId, @Valid @RequestBody UpdateExamRequest req) {
        return service.update(examId, req);
    }

    @DeleteMapping("/{examId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String examId) {
        service.delete(examId);
    }
}

