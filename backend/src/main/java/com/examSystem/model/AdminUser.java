package com.examSystem.model;

/**
 * AdminUser - Abstract base class for all admin types.
 * Demonstrates ABSTRACTION - admin-only methods strictly walled off.
 * [Member 5 - Administrative Management]
 */
public abstract class AdminUser {

    private String adminId;
    private String username;
    private String email;
    private String role;
    private boolean active;
    private String department;
    private String createdAt;

    public AdminUser() {}

    public AdminUser(String adminId, String username, String email,
                     String role, String department) {
        this.adminId    = adminId;
        this.username   = username;
        this.email      = email;
        this.role       = role;
        this.department = department;
        this.active     = true;
        this.createdAt  = java.time.LocalDateTime.now().toString();
    }

    public abstract String publishAllResults();
    public abstract String shutdownSystem();
    public abstract String toggleGlobalPermission(String permission, boolean enabled);

    public boolean hasAccess(String resource) { return this.active; }
    public void revokeAccess()  { this.active = false; }
    public void restoreAccess() { this.active = true; }
    public String getDisplayName() { return "[" + role + "] " + username; }

    public String toFileString() {
        return String.join("|",
            s(adminId), s(username), s(email), s(role),
            s(department), String.valueOf(active), s(createdAt));
    }
    private String s(String v) { return v != null ? v : ""; }

    public String  getAdminId()            { return adminId; }
    public void    setAdminId(String v)    { this.adminId = v; }
    public String  getUsername()           { return username; }
    public void    setUsername(String v)   { this.username = v; }
    public String  getEmail()              { return email; }
    public void    setEmail(String v)      { this.email = v; }
    public String  getRole()               { return role; }
    public void    setRole(String v)       { this.role = v; }
    public boolean isActive()              { return active; }
    public void    setActive(boolean v)    { this.active = v; }
    public String  getDepartment()         { return department; }
    public void    setDepartment(String v) { this.department = v; }
    public String  getCreatedAt()          { return createdAt; }
    public void    setCreatedAt(String v)  { this.createdAt = v; }
}
