package com.examSystem.controller;

import com.examSystem.model.FinalResult;
import com.examSystem.model.Result;
import com.examSystem.service.ResultService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/results")
@CrossOrigin(origins = "*")   // Allow calls from your frontend HTML files
public class ResultController {

    @Autowired
    private ResultService resultService;

    //READ: Teacher fetches all results for an exam

    /**
     * GET /api/results/exam/EXAM-2024-001
     * Used by teacher-grading.html when clicking "Load Results"
     */
    @GetMapping("/exam/{examId}")
    public ResponseEntity<List<Result>> getResultsByExam(@PathVariable String examId) {
        List<Result> results = resultService.getResultsByExam(examId);
        return ResponseEntity.ok(results);
    }

    //READ: Student fetches their own published results

    /**
     * GET /api/results/student/STU-001
     * Used by student-dashboard.html when the student clicks "View Results"
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Result>> getStudentResults(@PathVariable String studentId) {
        List<Result> results = resultService.getPublishedResultsForStudent(studentId);
        return ResponseEntity.ok(results);
    }

    //CREATE: Generate result after exam submission

    /**
     * POST /api/results/generate
     * Body: { "studentId": "STU-001", "examId": "EXAM-2024-001", "mcqScore": 40 }
     * Called by SubmissionController after auto-grading MCQ answers.
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generateResult(@RequestBody Map<String, Object> body) {
        try {
            String studentId = (String) body.get("studentId");
            String examId    = (String) body.get("examId");
            int    mcqScore  = (int) body.get("mcqScore");

            Result result = resultService.generateResult(studentId, examId, mcqScore);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to generate result: " + e.getMessage()));
        }
    }

    //UPDATE: Teacher manually grades the essay

    /**
     * PUT /api/results/{id}/grade
     * Body: { "teacherId": "TCH-001", "essayScore": 45, "feedback": "Great work!" }
     * Used by teacher-grading.html modal "Save Changes" button.
     */
    @PutMapping("/{id}/grade")
    public ResponseEntity<?> updateGrade(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            String teacherId  = (String) body.get("teacherId");
            int    essayScore = (int) body.get("essayScore");
            String feedback   = (String) body.get("feedback");

            Result updated = resultService.updateEssayGrade(id, teacherId, essayScore, feedback);
            return ResponseEntity.ok(updated);

        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    //UPDATE: Teacher publishes a result

    /**
     * PUT /api/results/{id}/publish
     * Body: { "teacherId": "TCH-001" }
     * Promotes InternalResult → FinalResult. Student can see it after this.
     */
    @PutMapping("/{id}/publish")
    public ResponseEntity<?> publishResult(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            String teacherId = (String) body.get("teacherId");
            FinalResult published = resultService.publishResult(id, teacherId);
            return ResponseEntity.ok(published);

        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    //DELETE: Teacher removes a result

    /**
     * DELETE /api/results/{id}
     * Used by teacher-grading.html "Delete" button inside the modal.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResult(@PathVariable String id) {
        try {
            resultService.deleteResult(id);
            return ResponseEntity.ok(Map.of("message", "Result deleted successfully."));

        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    //READ: Class statistics for teacher

    /**
     * GET /api/results/exam/EXAM-2024-001/stats
     * Returns { "average": 72.50, "highest": 95, "lowest": 40, "count": 12 }
     * Used by the averageDisplay div in teacher-grading.html
     */
    @GetMapping("/exam/{examId}/stats")
    public ResponseEntity<Map<String, Object>> getExamStats(@PathVariable String examId) {
        List<Result> results = resultService.getResultsByExam(examId);

        Map<String, Object> stats = Map.of(
                "examId",   examId,
                "count",    results.size(),
                "average",  resultService.getClassAverage(examId),
                "highest",  resultService.getHighestScore(examId),
                "lowest",   resultService.getLowestScore(examId)
        );
        return ResponseEntity.ok(stats);
    }
}
