document.addEventListener("DOMContentLoaded", () => {
  // --- MOCK DATA ---
  let resultsData = [
    {
      id: "1", studentId: "STU-001", examId: "EXAM-2024-001",
      mcqScore: 40, essayScore: 45, totalScore: 85,
      resultStatus: "Final", feedback: "Excellent work!"
    },
    {
      id: "2", studentId: "STU-001", examId: "EXAM-2024-002",
      mcqScore: 30, essayScore: 20, totalScore: 50,
      resultStatus: "Final", feedback: "Needs improvement on essay structure."
    },
    {
      id: "3", studentId: "STU-002", examId: "EXAM-2024-001",
      mcqScore: 20, essayScore: 25, totalScore: 45,
      resultStatus: "Internal", feedback: ""
    }
  ];

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showAlert(id, msg, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = `alert alert-${type} show`;
    setTimeout(() => el.classList.remove("show"), 4000);
  }

  function badgeForStatus(status) {
    const s = (status || "Internal").toLowerCase();
    if (s === "final" || s === "published") return "badge badge-green";
    if (s === "internal" || s === "pending") return "badge badge-amber";
    return "badge badge-gray";
  }

  // --- TEACHER GRADING PANEL ---
  const loadResultsBtn = document.getElementById("loadResultsBtn");
  if (loadResultsBtn) {
    loadResultsBtn.addEventListener("click", () => {
      const examId = document.getElementById("filterExamId").value.trim();
      if (!examId) {
        showAlert("gradingAlert", "Please enter an Exam ID.", "error");
        return;
      }
      renderTeacherTable(examId);
      updateAverage(examId);
    });

    function updateAverage(examId) {
      const display = document.getElementById("averageDisplay");
      const filtered = resultsData.filter(r => r.examId === examId);
      if (filtered.length === 0) {
        display.textContent = "";
        return;
      }
      const total = filtered.reduce((sum, r) => sum + r.totalScore, 0);
      const average = total / filtered.length;
      display.textContent = `Class Average: ${average.toFixed(2)} (Based on ${filtered.length} students)`;
    }

    function renderTeacherTable(examId) {
      const tbody = document.getElementById("gradingTableBody");
      const filtered = resultsData.filter(r => r.examId === examId);
      
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:var(--text-muted); padding:18px 16px;">No results found for this exam. Try EXAM-2024-001.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(r => `
        <tr data-result-id="${escapeHtml(r.id)}">
          <td><strong>${escapeHtml(r.studentId)}</strong></td>
          <td>${escapeHtml(r.mcqScore || 0)}</td>
          <td>${escapeHtml(r.essayScore || 0)}</td>
          <td><strong>${escapeHtml(r.totalScore || 0)}</strong></td>
          <td><span class="${badgeForStatus(r.resultStatus)}">${escapeHtml(r.resultStatus)}</span></td>
          <td>
            <button class="btn btn-outline btn-sm" data-action="edit" data-id="${r.id}">Grade</button>
          </td>
        </tr>
      `).join("");
    }

    const tbody = document.getElementById("gradingTableBody");
    tbody.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("button[data-action='edit']");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const r = resultsData.find(item => item.id === id);
      if (!r) return;
      
      document.getElementById("editResultId").value = r.id;
      document.getElementById("editEssayScore").value = r.essayScore || 0;
      document.getElementById("editFeedback").value = r.feedback || "";
      document.getElementById("editStatus").value = r.resultStatus === "Final" ? "PUBLISHED" : "PENDING";
      
      document.getElementById("editResultModal").style.display = "flex";
    });

    document.getElementById("closeEditModal").addEventListener("click", () => {
      document.getElementById("editResultModal").style.display = "none";
    });

    document.getElementById("editResultForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("editResultId").value;
      const essayScore = Number(document.getElementById("editEssayScore").value);
      const feedback = document.getElementById("editFeedback").value;
      const statusInput = document.getElementById("editStatus").value;

      const idx = resultsData.findIndex(r => r.id === id);
      if (idx !== -1) {
        resultsData[idx].essayScore = essayScore;
        resultsData[idx].feedback = feedback;
        resultsData[idx].resultStatus = statusInput === "PUBLISHED" ? "Final" : "Internal";
        resultsData[idx].totalScore = resultsData[idx].mcqScore + essayScore;
        
        showAlert("gradingAlert", "Result updated (Demo Mode)", "success");
        document.getElementById("editResultModal").style.display = "none";
        renderTeacherTable(resultsData[idx].examId);
        updateAverage(resultsData[idx].examId);
      }
    });

    document.getElementById("deleteResultBtn").addEventListener("click", () => {
      const id = document.getElementById("editResultId").value;
      if(confirm("Are you sure? (Demo Mode)")) {
        const idx = resultsData.findIndex(r => r.id === id);
        if (idx !== -1) {
          const examId = resultsData[idx].examId;
          resultsData.splice(idx, 1);
          showAlert("gradingAlert", "Result deleted (Demo Mode)", "success");
          document.getElementById("editResultModal").style.display = "none";
          renderTeacherTable(examId);
          updateAverage(examId);
        }
      }
    });
  }

  // --- STUDENT DASHBOARD ---
  const loadStudentResultsBtn = document.getElementById("loadStudentResultsBtn");
  if (loadStudentResultsBtn) {
    loadStudentResultsBtn.addEventListener("click", () => {
      const studentId = document.getElementById("studentIdInput").value.trim();
      if (!studentId) {
        showAlert("studentAlert", "Please enter your Student ID.", "error");
        return;
      }
      renderStudentTable(studentId);
    });

    const loggedInStudent = localStorage.getItem("loggedInStudent");
    if (loggedInStudent) {
      document.getElementById("studentIdInput").value = loggedInStudent;
      renderStudentTable(loggedInStudent);
    }

    function renderStudentTable(studentId) {
      const tbody = document.getElementById("studentTableBody");
      const publishedResults = resultsData.filter(r => r.studentId === studentId && r.resultStatus === "Final");

      if (publishedResults.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="color:var(--text-muted); padding:18px 16px;">No published results found for student: ${escapeHtml(studentId)}. Try STU-001.</td></tr>`;
        return;
      }

      tbody.innerHTML = publishedResults.map(r => `
        <tr>
          <td><strong>${escapeHtml(r.examId)}</strong></td>
          <td><strong>${escapeHtml(r.totalScore || 0)}</strong></td>
          <td>${escapeHtml(r.feedback || "—")}</td>
          <td><span class="badge badge-green">PUBLISHED</span></td>
        </tr>
      `).join("");
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("loggedInStudent");
      });
    }
  }
});
