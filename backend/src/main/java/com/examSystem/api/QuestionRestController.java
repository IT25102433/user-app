package com.examSystem.api;

import com.examSystem.api.dto.CreateMcqQuestionRequest;
import com.examSystem.api.dto.CreateShortAnswerQuestionRequest;
import com.examSystem.model.QuestionEntity;
import com.examSystem.service.QuestionManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "http://localhost:5173")
public class QuestionRestController {
    private final QuestionManagementService service;

    public QuestionRestController(QuestionManagementService service) {
        this.service = service;
    }

    @PostMapping("/mcq")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionEntity createMcq(@Valid @RequestBody CreateMcqQuestionRequest req) {
        return service.createMcq(req);
    }

    @PostMapping("/short")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionEntity createShort(@Valid @RequestBody CreateShortAnswerQuestionRequest req) {
        return service.createShort(req);
    }

    @GetMapping
    public List<QuestionEntity> list(@RequestParam(required = false) String subjectCode,
                                    @RequestParam(required = false) String examId) {
        return service.list(subjectCode, examId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}

