package com.examSystem.controller;

import com.examSystem.model.User;
import com.examSystem.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest body) {
        User user = authService.register(
                body.fullName(),
                body.email().trim().toLowerCase(),
                body.password(),
                body.role()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Registered successfully",
                "email", user.getEmail(),
                "role", user.getRole()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginRequest body) {
        AuthService.LoginResult result = authService.login(
                body.email().trim().toLowerCase(),
                body.password()
        );
        return ResponseEntity.ok(Map.of(
                "email", result.email(),
                "role", result.role()
        ));
    }

    public record RegisterRequest(
            @NotBlank(message = "Full name is required") String fullName,
            @NotBlank @Email(message = "Valid email is required") String email,
            @NotBlank(message = "Password is required") String password,
            @NotBlank(message = "Role is required")
            @Pattern(regexp = "(?i)ADMIN|USER", message = "Role must be ADMIN or USER")
            String role
    ) {
    }

    public record LoginRequest(
            @NotBlank @Email(message = "Valid email is required") String email,
            @NotBlank(message = "Password is required") String password
    ) {
    }
}
