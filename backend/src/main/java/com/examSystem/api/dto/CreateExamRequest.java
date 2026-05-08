package com.examSystem.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateExamRequest(
        @NotBlank String examId,
        @NotBlank String subjectCode,
        @Min(1) int durationMinutes,
        @Min(0) int totalMarks,
        @NotNull LocalDate examDate,
        @Min(0) Integer graceMinutes,
        @Min(0) @Max(100) Integer passCriteriaPercent
) {}

