package com.examSystem.service;

import com.examSystem.model.FinalResult;
import com.examSystem.model.InternalResult;
import com.examSystem.model.Result;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * SERVICE — ResultService
 * Contains all business logic for results:
 *  - Generating a result after exam submission
 *  - Fetching results for teachers and students
 *  - Updating essay scores and feedback
 *  - Publishing (promoting InternalResult → FinalResult)
 *  - Calculating class averages
 *
 * NOTE: In a real project, this talks to a ResultRepository (JPA).
 * Here, the repository calls are shown as comments so you can wire them in.
 *
 * OOP Concepts used:
 *  - Polymorphism  : works with Result references, calls subclass methods
 *  - Encapsulation : hides all DB + logic details from the controller
 */
@Service
public class ResultService {

    // In the real project, inject your Supabase-backed repository here:
    // @Autowired private ResultRepository resultRepository;

    // ── In-memory store for demo/testing ─────────────────────────────────────
    // Replace this with resultRepository calls once your DB is set up.
    private final List<Result> store = new ArrayList<>(List.of(
            createInternal("STU-001", "EXAM-2024-001", 40, 45, "Excellent work!"),
            createInternal("STU-001", "EXAM-2024-002", 30, 20, "Needs improvement."),
            createInternal("STU-002", "EXAM-2024-001", 20, 25, "")
    ));

    private static InternalResult createInternal(
            String sid, String eid, int mcq, int essay, String fb) {
        InternalResult r = new InternalResult(sid, eid, mcq, essay);
        r.setFeedback(fb);
        return r;
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    /**
     * Called automatically after a student submits an exam.
     * Creates an InternalResult with the MCQ score; essay score starts at 0.
     *
     * @param studentId  e.g. "STU-001"
     * @param examId     e.g. "EXAM-2024-001"
     * @param mcqScore   auto-calculated MCQ score from SubmissionService
     * @return the newly created InternalResult
     */
    public InternalResult generateResult(String studentId, String examId, int mcqScore) {
        InternalResult result = new InternalResult(studentId, examId, mcqScore, 0);
        store.add(result);
        // resultRepository.save(result);
        return result;
    }

    // ── READ ──────────────────────────────────────────────────────────────────

    /**
     * Teacher view — returns ALL results for a given exam (any status).
     */
    public List<Result> getResultsByExam(String examId) {
        // return resultRepository.findByExamId(examId);
        return store.stream()
                .filter(r -> r.getExamId().equals(examId))
                .collect(Collectors.toList());
    }

    /**
     * Student view — returns only PUBLISHED (FINAL) results for a student.
     * Demonstrates polymorphism: isVisibleToStudent() is called on each result,
     * which routes to FinalResult.isVisibleToStudent() = true, or
     * InternalResult.isVisibleToStudent() = false.
     */
    public List<Result> getPublishedResultsForStudent(String studentId) {
        // return resultRepository.findByStudentIdAndResultStatus(studentId, "FINAL");
        return store.stream()
                .filter(r -> r.getStudentId().equals(studentId))
                .filter(Result::isVisibleToStudent)   // ← polymorphic call
                .collect(Collectors.toList());
    }

    /**
     * Fetch a single result by its ID.
     */
    public Optional<Result> getResultById(String id) {
        // return resultRepository.findById(id);
        return store.stream()
                .filter(r -> r.getId().equals(id))
                .findFirst();
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    /**
     * Teacher manually updates the essay score and/or feedback.
     * Only works on InternalResult — throws if already published.
     *
     * @param resultId   ID of the result row
     * @param teacherId  who is making the change (for audit log)
     * @param essayScore new essay score
     * @param feedback   teacher's written feedback
     */
    public Result updateEssayGrade(
            String resultId, String teacherId, int essayScore, String feedback) {

        Result result = getResultById(resultId)
                .orElseThrow(() -> new NoSuchElementException("Result not found: " + resultId));

        if (result instanceof FinalResult) {
            throw new IllegalStateException(
                    "Cannot edit a published result. Unpublish it first.");
        }

        InternalResult internal = (InternalResult) result;
        internal.markEssayGraded(teacherId, essayScore, "");
        internal.setFeedback(feedback);

        // resultRepository.save(internal);
        return internal;
    }

    /**
     * Publishes a result — promotes InternalResult → FinalResult.
     * The student will now see it on their dashboard.
     */
    public FinalResult publishResult(String resultId, String teacherId) {
        Result result = getResultById(resultId)
                .orElseThrow(() -> new NoSuchElementException("Result not found: " + resultId));

        if (result instanceof FinalResult) {
            throw new IllegalStateException("Result is already published.");
        }

        InternalResult internal = (InternalResult) result;
        FinalResult published = internal.publish(teacherId); // polymorphic promotion

        store.remove(internal);
        store.add(published);
        // resultRepository.save(published);

        return published;
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    /**
     * Deletes a result by ID.
     * Only teachers should be allowed to call this (enforced in the controller).
     */
    public void deleteResult(String resultId) {
        Result result = getResultById(resultId)
                .orElseThrow(() -> new NoSuchElementException("Result not found: " + resultId));
        store.remove(result);
        // resultRepository.deleteById(resultId);
    }

    // ── ANALYTICS ────────────────────────────────────────────────────────────

    /**
     * Calculates the class average total score for a given exam.
     * Used by the teacher's grading panel to show "Class Average: 72.50"
     */
    public double getClassAverage(String examId) {
        List<Result> results = getResultsByExam(examId);
        if (results.isEmpty()) return 0.0;
        return results.stream()
                .mapToInt(Result::getTotalScore)
                .average()
                .orElse(0.0);
    }

    /**
     * Returns the highest score in a given exam.
     */
    public int getHighestScore(String examId) {
        return getResultsByExam(examId).stream()
                .mapToInt(Result::getTotalScore)
                .max()
                .orElse(0);
    }

    /**
     * Returns the lowest score in a given exam.
     */
    public int getLowestScore(String examId) {
        return getResultsByExam(examId).stream()
                .mapToInt(Result::getTotalScore)
                .min()
                .orElse(0);
    }
}
