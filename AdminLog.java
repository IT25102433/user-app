package com.examSystem.model;

/**
 * AdminLog — System activity log entry.
 * Demonstrates ENCAPSULATION — private fields with public getters/setters.
 *
 * [Member 5 - Administrative Management]
 */
public class AdminLog {

    private String logId;
    private String adminId;
    private String action;    // e.g. "ADMIN_CREATED", "RESULTS_PUBLISHED"
    private String targetId;
    private String details;
    private String severity;  // "INFO", "WARNING", "CRITICAL"
    private String timestamp;

    public AdminLog() {}

    public AdminLog(String logId, String adminId, String action,
                    String targetId, String details, String severity) {
        this.logId     = logId;
        this.adminId   = adminId;
        this.action    = action;
        this.targetId  = targetId;
        this.details   = details;
        this.severity  = severity;
        this.timestamp = java.time.LocalDateTime.now().toString();
    }

    // ── File serialization ───────────────────────────────────────────────────
    public String toFileString() {
        return String.join("|",
            s(logId), s(adminId), s(action), s(targetId),
            s(details), s(severity), s(timestamp));
    }

    public static AdminLog fromFileString(String line) {
        if (line == null || line.isBlank()) return null;
        String[] p = line.split("\\|", -1);
        AdminLog log = new AdminLog();
        if (p.length > 0) log.setLogId(p[0]);
        if (p.length > 1) log.setAdminId(p[1]);
        if (p.length > 2) log.setAction(p[2]);
        if (p.length > 3) log.setTargetId(p[3]);
        if (p.length > 4) log.setDetails(p[4]);
        if (p.length > 5) log.setSeverity(p[5]);
        if (p.length > 6) log.setTimestamp(p[6]);
        return log;
    }

    private String s(String v) { return v != null ? v : ""; }

    // ── Getters & Setters ────────────────────────────────────────────────────
    public String getLogId()             { return logId; }
    public void   setLogId(String v)     { this.logId = v; }
    public String getAdminId()           { return adminId; }
    public void   setAdminId(String v)   { this.adminId = v; }
    public String getAction()            { return action; }
    public void   setAction(String v)    { this.action = v; }
    public String getTargetId()          { return targetId; }
    public void   setTargetId(String v)  { this.targetId = v; }
    public String getDetails()           { return details; }
    public void   setDetails(String v)   { this.details = v; }
    public String getSeverity()          { return severity; }
    public void   setSeverity(String v)  { this.severity = v; }
    public String getTimestamp()         { return timestamp; }
    public void   setTimestamp(String v) { this.timestamp = v; }
}
