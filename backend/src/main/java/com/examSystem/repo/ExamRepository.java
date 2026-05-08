package com.examSystem.repo;

import com.examSystem.model.ExamEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamRepository extends JpaRepository<ExamEntity, String> {}

