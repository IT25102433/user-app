package com.examSystem.repo;

import com.examSystem.model.QuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<QuestionEntity, Long> {
    List<QuestionEntity> findBySubjectCodeIgnoreCase(String subjectCode);
    List<QuestionEntity> findByExamExamIdIgnoreCase(String examId);
    boolean existsBySubjectCodeIgnoreCaseAndTextIgnoreCase(String subjectCode, String text);
}

