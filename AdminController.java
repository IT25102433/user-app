package com.examSystem.controller;

import com.examSystem.model.AdminLog;
import com.examSystem.model.AdminUser;
import com.examSystem.service.AdminService;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.*;
import java.util.*;

/**
 * AdminController — HTTP Servlet for all admin CRUD operations.
 *
 * GET  /admin?action=list            → all admins
 * GET  /admin?action=logs&limit=N    → system logs
 * GET  /admin?action=settings        → global settings
 * POST /admin?action=create          → create admin
 * POST /admin?action=update&id=X     → update admin
 * POST /admin?action=delete&id=X     → delete admin
 * POST /admin?action=toggle&id=X     → toggle access
 * POST /admin?action=publishResults  → publish all results
 * POST /admin?action=shutdown        → maintenance mode
 * POST /admin?action=togglePermission → toggle global permission
 *
 * [Member 5 - Administrative Management]
 */
@WebServlet("/admin")
public class AdminController extends HttpServlet {

    private AdminService adminService;

    @Override
    public void init() { adminService = new AdminService(); }

    // ── GET ──────────────────────────────────────────────────────────────────
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        setHeaders(resp);
        PrintWriter out = resp.getWriter();
        String action = req.getParameter("action");
        if (action == null) action = "list";
        try {
            switch (action) {
                case "list" -> out.print(adminsToJson(adminService.getAllAdmins()));
                case "logs" -> {
                    int limit = 50;
                    try { if (req.getParameter("limit") != null)
                              limit = Integer.parseInt(req.getParameter("limit")); }
                    catch (NumberFormatException ignored) {}
                    out.print(logsToJson(adminService.getLogs(limit)));
                }
                case "settings" -> out.print(settingsToJson(adminService.getAllSettings()));
                default -> { resp.setStatus(400);
                             out.print("{\"error\":\"Unknown action\"}"); }
            }
        } catch (Exception e) {
            resp.setStatus(500);
            out.print("{\"error\":\"" + esc(e.getMessage()) + "\"}");
        }
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        setHeaders(resp);
        PrintWriter out = resp.getWriter();
        String action = req.getParameter("action");
        if (action == null) action = "";
        try {
            switch (action) {
                case "create" -> {
                    String u = req.getParameter("username");
                    String e = req.getParameter("email");
                    String r = req.getParameter("role");
                    String d = req.getParameter("department");
                    if (u == null || e == null || r == null) {
                        resp.setStatus(400);
                        out.print("{\"error\":\"username, email, role required\"}"); return;
                    }
                    boolean ok = adminService.createAdmin(u, e, r, d != null ? d : "");
                    out.print(ok
                        ? "{\"success\":true,\"message\":\"Admin created: " + esc(u) + "\"}"
                        : "{\"error\":\"Username already exists\"}");
                }
                case "update" -> {
                    String id = req.getParameter("id");
                    if (id == null) { resp.setStatus(400); out.print("{\"error\":\"id required\"}"); return; }
                    boolean ok = adminService.updateAdmin(id,
                        req.getParameter("username"),
                        req.getParameter("email"),
                        req.getParameter("department"));
                    out.print(ok ? "{\"success\":true}" : "{\"error\":\"Not found\"}");
                }
                case "delete" -> {
                    String id = req.getParameter("id");
                    if (id == null) { resp.setStatus(400); out.print("{\"error\":\"id required\"}"); return; }
                    boolean ok = adminService.deleteAdmin(id);
                    out.print(ok ? "{\"success\":true}" : "{\"error\":\"Not found\"}");
                }
                case "toggle" -> {
                    String id = req.getParameter("id");
                    String ac = req.getParameter("active");
                    if (id == null || ac == null) { resp.setStatus(400); out.print("{\"error\":\"id and active required\"}"); return; }
                    boolean ok = adminService.toggleAdminAccess(id, Boolean.parseBoolean(ac));
                    out.print(ok ? "{\"success\":true}" : "{\"error\":\"Not found\"}");
                }
                case "publishResults" -> {
                    String msg = adminService.publishAllResults();
                    out.print("{\"success\":true,\"message\":\"" + esc(msg) + "\"}");
                }
                case "shutdown" -> {
                    String msg = adminService.activateMaintenanceMode();
                    out.print("{\"success\":true,\"message\":\"" + esc(msg) + "\"}");
                }
                case "togglePermission" -> {
                    String perm = req.getParameter("permission");
                    String en   = req.getParameter("enabled");
                    if (perm == null || en == null) { resp.setStatus(400); out.print("{\"error\":\"permission and enabled required\"}"); return; }
                    String msg = adminService.toggleGlobalPermission(perm, Boolean.parseBoolean(en));
                    out.print("{\"success\":true,\"message\":\"" + esc(msg) + "\"}");
                }
                default -> { resp.setStatus(400); out.print("{\"error\":\"Unknown action\"}"); }
            }
        } catch (Exception e) {
            resp.setStatus(500);
            out.print("{\"error\":\"" + esc(e.getMessage()) + "\"}");
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private void setHeaders(HttpServletResponse resp) {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        resp.setHeader("Access-Control-Allow-Origin", "*");
    }

    private String adminsToJson(List<AdminUser> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            AdminUser a = list.get(i);
            if (i > 0) sb.append(",");
            sb.append("{")
              .append("\"admin_id\":\"").append(esc(a.getAdminId())).append("\",")
              .append("\"username\":\"").append(esc(a.getUsername())).append("\",")
              .append("\"email\":\"").append(esc(a.getEmail())).append("\",")
              .append("\"role\":\"").append(esc(a.getRole())).append("\",")
              .append("\"department\":\"").append(esc(a.getDepartment())).append("\",")
              .append("\"is_active\":").append(a.isActive()).append(",")
              .append("\"created_at\":\"").append(esc(a.getCreatedAt())).append("\"")
              .append("}");
        }
        return sb.append("]").toString();
    }

    private String logsToJson(List<AdminLog> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            AdminLog l = list.get(i);
            if (i > 0) sb.append(",");
            sb.append("{")
              .append("\"log_id\":\"").append(esc(l.getLogId())).append("\",")
              .append("\"admin_id\":\"").append(esc(l.getAdminId())).append("\",")
              .append("\"action\":\"").append(esc(l.getAction())).append("\",")
              .append("\"target_id\":\"").append(esc(l.getTargetId())).append("\",")
              .append("\"details\":\"").append(esc(l.getDetails())).append("\",")
              .append("\"severity\":\"").append(esc(l.getSeverity())).append("\",")
              .append("\"timestamp\":\"").append(esc(l.getTimestamp())).append("\"")
              .append("}");
        }
        return sb.append("]").toString();
    }

    private String settingsToJson(Map<String, String> settings) {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (Map.Entry<String, String> e : settings.entrySet()) {
            if (!first) sb.append(",");
            sb.append("{\"key\":\"").append(esc(e.getKey()))
              .append("\",\"value\":\"").append(esc(e.getValue())).append("\"}");
            first = false;
        }
        return sb.append("]").toString();
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\","\\\\").replace("\"","\\\"")
                .replace("\n","\\n").replace("\r","\\r");
    }
}
