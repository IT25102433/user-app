package com.examSystem.repository;

import com.examSystem.model.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ResultRepository
        extends JpaRepository<Result, String> {

    // Teacher grading panel
    List<Result> findByExamId(String examId);

    // Student dashboard
    List<Result> findByStudentIdAndResultStatus(
            String studentId,
            String status
    );
}