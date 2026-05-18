package com.examSystem.service;

import com.examSystem.model.AdminLog;
import com.examSystem.model.AdminUser;
import com.examSystem.model.SuperAdmin;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AdminService — Business logic for all admin operations.
 * Handles file-based CRUD using admins.txt, admin_logs.txt, settings.txt.
 *
 * [Member 5 - Administrative Management]
 */
public class AdminService {

    private static final String DATA_DIR      = "data/";
    private static final String ADMINS_FILE   = DATA_DIR + "admins.txt";
    private static final String LOGS_FILE     = DATA_DIR + "admin_logs.txt";
    private static final String SETTINGS_FILE = DATA_DIR + "settings.txt";

    public AdminService() { ensureDataFiles(); }

    // ── CREATE ───────────────────────────────────────────────────────────────
    public boolean createAdmin(String username, String email,
                                String role, String department) {
        if (findAdminByUsername(username) != null) return false;
        String id = "ADM_" + System.currentTimeMillis();
        SuperAdmin a = new SuperAdmin(id, username, email, department);
        a.setRole(role);
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(ADMINS_FILE, true))) {
            bw.write(a.toFileString());
            bw.newLine();
            writeLog("SYSTEM", "ADMIN_CREATED", id,
                     "New admin registered: " + username + " (" + role + ")", "INFO");
            return true;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    // ── READ ─────────────────────────────────────────────────────────────────
    public List<AdminUser> getAllAdmins() {
        List<AdminUser> list = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(ADMINS_FILE))) {
            String line;
            while ((line = br.readLine()) != null)
                if (!line.isBlank()) list.add(parseAdmin(line));
        } catch (IOException e) { e.printStackTrace(); }
        return list;
    }

    public AdminUser findAdminById(String adminId) {
        return getAllAdmins().stream()
            .filter(a -> adminId.equals(a.getAdminId()))
            .findFirst().orElse(null);
    }

    public AdminUser findAdminByUsername(String username) {
        return getAllAdmins().stream()
            .filter(a -> username.equalsIgnoreCase(a.getUsername()))
            .findFirst().orElse(null);
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────
    public boolean updateAdmin(String adminId, String username,
                                String email, String department) {
        List<AdminUser> admins = getAllAdmins();
        boolean found = false;
        for (AdminUser a : admins) {
            if (adminId.equals(a.getAdminId())) {
                if (username   != null) a.setUsername(username);
                if (email      != null) a.setEmail(email);
                if (department != null) a.setDepartment(department);
                found = true; break;
            }
        }
        if (!found) return false;
        if (writeAllAdmins(admins)) {
            writeLog("SYSTEM", "ADMIN_UPDATED", adminId,
                     "Admin details updated: " + adminId, "INFO");
            return true;
        }
        return false;
    }

    public boolean toggleAdminAccess(String adminId, boolean active) {
        List<AdminUser> admins = getAllAdmins();
        boolean found = false;
        for (AdminUser a : admins) {
            if (adminId.equals(a.getAdminId())) {
                a.setActive(active);
                if (active) a.restoreAccess(); else a.revokeAccess();
                found = true; break;
            }
        }
        if (!found) return false;
        if (writeAllAdmins(admins)) {
            String action = active ? "ACCESS_RESTORED" : "ACCESS_REVOKED";
            writeLog("SYSTEM", action, adminId,
                     "Access " + (active ? "restored" : "revoked") + ": " + adminId,
                     active ? "INFO" : "WARNING");
            return true;
        }
        return false;
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    public boolean deleteAdmin(String adminId) {
        List<AdminUser> admins = getAllAdmins();
        boolean removed = admins.removeIf(a -> adminId.equals(a.getAdminId()));
        if (!removed) return false;
        if (writeAllAdmins(admins)) {
            writeLog("SYSTEM", "ADMIN_DELETED", adminId,
                     "Admin account deleted: " + adminId, "WARNING");
            return true;
        }
        return false;
    }

    // ── ADMIN ACTIONS (OOP abstract methods) ─────────────────────────────────
    public String publishAllResults() {
        SuperAdmin a = new SuperAdmin("SYS", "System", "sys@exam.com", "Ops");
        String result = a.publishAllResults();
        writeLog("SYSTEM", "RESULTS_PUBLISHED", "ALL_EXAMS",
                 "All exam results published system-wide", "INFO");
        return result;
    }

    public String activateMaintenanceMode() {
        SuperAdmin a = new SuperAdmin("SYS", "System", "sys@exam.com", "Ops");
        String result = a.shutdownSystem();
        updateSetting("maintenance_mode", "true");
        writeLog("SYSTEM", "SYSTEM_SHUTDOWN", "GLOBAL",
                 "Maintenance mode activated", "CRITICAL");
        return result;
    }

    public String toggleGlobalPermission(String permission, boolean enabled) {
        SuperAdmin a = new SuperAdmin("SYS", "System", "sys@exam.com", "Ops");
        String result = a.toggleGlobalPermission(permission, enabled);
        updateSetting(permission, String.valueOf(enabled));
        writeLog("SYSTEM", "PERMISSION_TOGGLED", permission,
                 "Permission '" + permission + "' set to " + enabled, "WARNING");
        return result;
    }

    // ── LOGS ─────────────────────────────────────────────────────────────────
    public List<AdminLog> getLogs(int limit) {
        List<AdminLog> logs = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(LOGS_FILE))) {
            String line;
            while ((line = br.readLine()) != null)
                if (!line.isBlank()) logs.add(AdminLog.fromFileString(line));
        } catch (IOException e) { e.printStackTrace(); }
        Collections.reverse(logs);
        return logs.stream().limit(limit).collect(Collectors.toList());
    }

    // ── SETTINGS ─────────────────────────────────────────────────────────────
    public Map<String, String> getAllSettings() {
        Map<String, String> s = new LinkedHashMap<>();
        s.put("maintenance_mode",      "false");
        s.put("exam_submissions_open", "true");
        s.put("result_publishing",     "false");
        s.put("user_registration",     "true");
        try (BufferedReader br = new BufferedReader(new FileReader(SETTINGS_FILE))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.isBlank() || !line.contains("=")) continue;
                String[] p = line.split("=", 2);
                s.put(p[0].trim(), p[1].trim());
            }
        } catch (IOException ignored) {}
        return s;
    }

    public boolean updateSetting(String key, String value) {
        Map<String, String> s = getAllSettings();
        s.put(key, value);
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(SETTINGS_FILE, false))) {
            for (Map.Entry<String, String> e : s.entrySet()) {
                bw.write(e.getKey() + "=" + e.getValue());
                bw.newLine();
            }
            return true;
        } catch (IOException e) { e.printStackTrace(); return false; }
    }

    // ── HELPERS ──────────────────────────────────────────────────────────────
    private void writeLog(String adminId, String action, String target,
                           String details, String severity) {
        String id = "LOG_" + System.currentTimeMillis();
        AdminLog log = new AdminLog(id, adminId, action, target, details, severity);
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(LOGS_FILE, true))) {
            bw.write(log.toFileString()); bw.newLine();
        } catch (IOException e) {
            System.err.println("Log write failed: " + e.getMessage());
        }
    }

    private boolean writeAllAdmins(List<AdminUser> admins) {
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(ADMINS_FILE, false))) {
            for (AdminUser a : admins) { bw.write(a.toFileString()); bw.newLine(); }
            return true;
        } catch (IOException e) { e.printStackTrace(); return false; }
    }

    private AdminUser parseAdmin(String line) {
        String[] p = line.split("\\|", -1);
        SuperAdmin a = new SuperAdmin();
        if (p.length > 0) a.setAdminId(p[0]);
        if (p.length > 1) a.setUsername(p[1]);
        if (p.length > 2) a.setEmail(p[2]);
        if (p.length > 3) a.setRole(p[3]);
        if (p.length > 4) a.setDepartment(p[4]);
        if (p.length > 5) a.setActive(Boolean.parseBoolean(p[5]));
        if (p.length > 6) a.setCreatedAt(p[6]);
        return a;
    }

    private void ensureDataFiles() {
        try {
            Files.createDirectories(Paths.get(DATA_DIR));
            for (String f : new String[]{ADMINS_FILE, LOGS_FILE, SETTINGS_FILE}) {
                Path p = Paths.get(f);
                if (!Files.exists(p)) Files.createFile(p);
            }
            if (Files.size(Paths.get(SETTINGS_FILE)) == 0) {
                updateSetting("maintenance_mode",      "false");
                updateSetting("exam_submissions_open", "true");
                updateSetting("result_publishing",     "false");
                updateSetting("user_registration",     "true");
            }
            if (Files.size(Paths.get(ADMINS_FILE)) == 0)
                createAdmin("superadmin", "admin@exam.com", "SUPER_ADMIN", "IT");
        } catch (IOException e) {
            System.err.println("Data init error: " + e.getMessage());
        }
    }
}
