package com.examSystem.model;

/**
 * SuperAdmin — Concrete implementation of AdminUser.
 * Demonstrates INHERITANCE (extends AdminUser) and POLYMORPHISM.
 *
 * [Member 5 - Administrative Management]
 */
public class SuperAdmin extends AdminUser {

    private String phoneNumber;
    private int    accessLevel; // 1–5; SuperAdmin = 5

    public SuperAdmin() {
        super();
        this.accessLevel = 5;
    }

    public SuperAdmin(String adminId, String username, String email, String department) {
        super(adminId, username, email, "SUPER_ADMIN", department);
        this.accessLevel = 5;
    }

    // ── Implement abstract methods ───────────────────────────────────────────

    @Override
    public String publishAllResults() {
        if (!isActive()) return "ERROR: Account inactive.";
        return "SUCCESS: All exam results published by " + getUsername()
               + " at " + java.time.LocalDateTime.now();
    }

    @Override
    public String shutdownSystem() {
        if (accessLevel < 5) return "ERROR: Insufficient access level.";
        return "SUCCESS: Maintenance mode activated by " + getUsername()
               + " at " + java.time.LocalDateTime.now();
    }

    @Override
    public String toggleGlobalPermission(String permission, boolean enabled) {
        if (!hasAccess("permissions")) return "ERROR: Access denied.";
        return "SUCCESS: '" + permission + "' set to "
               + (enabled ? "ENABLED" : "DISABLED") + " by " + getUsername();
    }

    // ── SuperAdmin-only methods ──────────────────────────────────────────────

    public String revokeEndpointAccess(String userId) {
        return "SUCCESS: Access revoked for user " + userId + " by " + getUsername();
    }

    public String createDeptHead(String username, String dept) {
        return "SUCCESS: Dept head '" + username + "' (" + dept
               + ") created by " + getUsername();
    }

    // ── Getters & Setters ────────────────────────────────────────────────────
    public String getPhoneNumber()         { return phoneNumber; }
    public void   setPhoneNumber(String v) { this.phoneNumber = v; }
    public int    getAccessLevel()         { return accessLevel; }
    public void   setAccessLevel(int v)    { this.accessLevel = v; }
}
