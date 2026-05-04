package com.examSystem.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CreateMcqQuestionRequest(
        @NotBlank String questionCode,
        @NotBlank String subjectCode,
        @NotBlank String text,
        @Min(1) int marks,
        @NotEmpty List<String> options,
        @Min(0) int correctIndex,
        String examId
) {}

