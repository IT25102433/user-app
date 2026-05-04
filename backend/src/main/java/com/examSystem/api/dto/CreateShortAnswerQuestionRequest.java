package com.examSystem.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateShortAnswerQuestionRequest(
        @NotBlank String questionCode,
        @NotBlank String subjectCode,
        @NotBlank String text,
        @Min(1) int marks,
        @NotBlank String expectedAnswer,
        String examId
) {}

