package com.examSystem.service;

import com.examSystem.model.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.NonUniqueResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PersistenceContext
    private EntityManager entityManager;

    public record LoginResult(String email, String role) {
    }

    @Transactional
    public User register(String fullName, String email, String password, String role) {
        if (findByEmail(email) != null) {
            throw new IllegalArgumentException("Email is already registered");
        }
        String normalizedRole = role.trim().toUpperCase();
        if (!normalizedRole.equals("ADMIN") && !normalizedRole.equals("USER")) {
            throw new IllegalArgumentException("Role must be ADMIN or USER");
        }

        User user = new User();
        user.setFullName(fullName.trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(normalizedRole);
        entityManager.persist(user);
        return user;
    }

    public LoginResult login(String email, String password) {
        User user = findByEmail(email);
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        return new LoginResult(user.getEmail(), user.getRole());
    }

    private User findByEmail(String email) {
        try {
            TypedQuery<User> q = entityManager.createQuery(
                    "SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email)", User.class);
            q.setParameter("email", email);
            return q.getSingleResult();
        } catch (NoResultException e) {
            return null;
        } catch (NonUniqueResultException e) {
            throw new IllegalArgumentException("Duplicate email records in database; fix users table.");
        }
    }
}
