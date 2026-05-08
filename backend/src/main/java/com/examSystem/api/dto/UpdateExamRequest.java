package com.examSystem.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.time.LocalDate;

public record UpdateExamRequest(
        String subjectCode,
        @Min(0) Integer graceMinutes,
        @Min(0) @Max(100) Integer passCriteriaPercent,
        @Min(1) Integer durationMinutes,
        @Min(0) Integer totalMarks,
        LocalDate examDate
) {}

