document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:8081/api";
  let examsCache = [];

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function apiJson(path, init) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    if (!res.ok) {
      let body = null;
      try {
        body = await res.json();
      } catch {}
      const msg = body?.message || body?.error || `${res.status} ${res.statusText}`;
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    return await res.json();
  }

  function badgeForStatus(status) {
    const s = (status || "Pending").toLowerCase();
    if (s === "done") return "badge badge-green";
    if (s === "pending") return "badge badge-amber";
    if (s === "cancel") return "badge badge-red";
    return "badge badge-gray";
  }

  const sidebarLinks = document.querySelectorAll(".sidebar a");
  sidebarLinks.forEach((link) => {
    if (link.href === window.location.href) link.classList.add("active");
  });

  function openEditModal() {
    const modal = document.getElementById("editExamModal");
    if (modal) modal.style.display = "flex";
  }

  function closeEditModal() {
    const modal = document.getElementById("editExamModal");
    if (modal) modal.style.display = "none";
  }

  function showConfirmDialog(message, onConfirm) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-card modal-card-sm">
        <div class="card-title">Confirm Delete</div>
        <p class="modal-message">${escapeHtml(message)}</p>
        <div class="form-actions" style="margin-top:12px; padding-top:0; border-top:0;">
          <button type="button" class="btn btn-outline btn-sm" data-action="cancel">Cancel</button>
          <button type="button" class="btn btn-danger btn-sm" data-action="confirm">Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", async (e) => {
      const action = e.target?.getAttribute?.("data-action");
      if (e.target === overlay || action === "cancel") {
        overlay.remove();
        return;
      }
      if (action === "confirm") {
        overlay.remove();
        await onConfirm();
      }
    });
  }

  async function renderExamTable() {
    const tbody = document.getElementById("examTableBody");
    if (!tbody) return;

    try {
      const exams = await apiJson("/exams");
      examsCache = Array.isArray(exams) ? exams : [];
      if (!Array.isArray(exams) || exams.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="color:var(--text-muted); padding:18px 16px;">
              No exams yet. Create one from <strong>Create Exam</strong>.
            </td>
          </tr>`;
        return;
      }

      tbody.innerHTML = exams
        .slice()
        .sort((a, b) => (a.examId || "").localeCompare(b.examId || ""))
        .map((e) => `
          <tr data-exam-id="${escapeHtml(e.examId || "")}">
            <td><strong>${escapeHtml(e.examId || "")}</strong></td>
            <td>${escapeHtml(e.subjectCode || "")}</td>
            <td>${escapeHtml(String(e.durationMinutes ?? ""))} min</td>
            <td>${escapeHtml(String(e.totalMarks ?? 0))}</td>
            <td><span class="${badgeForStatus(e.status)}">${escapeHtml(e.status || "Pending")}</span></td>
            <td>
              <button class="btn btn-outline btn-sm" data-action="pick">Edit</button>
              <button class="btn btn-danger btn-sm" style="margin-left:6px" data-action="delete">Delete</button>
            </td>
          </tr>
        `)
        .join("");
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="color:var(--text-muted); padding:18px 16px;">
            Cannot load exams. Make sure backend is running on <strong>localhost:8081</strong>.
          </td>
        </tr>`;
    }
  }

  async function deleteExamById(examId, alertId) {
    if (!examId) return;
    showConfirmDialog(`Delete exam "${examId}"?`, async () => {
      try {
        await apiJson(`/exams/${encodeURIComponent(examId)}`, { method: "DELETE" });
        showAlert(alertId, `Exam "${examId}" deleted.`, "success");
        closeEditModal();
        await renderExamTable();
      } catch (err) {
        showAlert(alertId, err.message || "Failed to delete exam.", "error");
      }
    });
  }

  function wireExamTableActions(alertId) {
    const tbody = document.getElementById("examTableBody");
    if (!tbody) return;

    tbody.addEventListener("click", async (e) => {
      const btn = e.target?.closest?.("button[data-action]");
      if (!btn) return;
      const tr = btn.closest("tr[data-exam-id]");
      const examId = tr?.getAttribute("data-exam-id");
      const action = btn.getAttribute("data-action");

      if (!examId) return;
      if (action === "pick") {
        if (document.getElementById("editExamForm")) {
          try {
            const ex = await apiJson(`/exams/${encodeURIComponent(examId)}`);
            document.getElementById("examId").value = ex.examId || "";
            document.getElementById("newDuration").value = ex.durationMinutes ?? "";
            const marksEl = document.getElementById("newMarks");
            if (marksEl) marksEl.value = ex.totalMarks ?? "";
            const statusEl = document.getElementById("newStatus");
            if (statusEl) statusEl.value = ex.status || "Pending";
            openEditModal();
          } catch (err) {
            showAlert("editAlert", err.message || "Failed to load exam.", "error");
          }
          return;
        }
        window.location.href = `edit-exam.html?examId=${encodeURIComponent(examId)}`;
        return;
      }
      if (action === "delete") {
        await deleteExamById(examId, alertId);
      }
    });
  }

  const createForm = document.getElementById("createExamForm");
  if (createForm) {
    createForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const examId = document.getElementById("examId").value.trim();
      const subjectCode = document.getElementById("subjectCode").value.trim();
      const durationMinutes = Number(document.getElementById("duration").value);
      const totalMarks = Number(document.getElementById("totalMarks")?.value || 0) || 0;
      const passCriteriaPercent = Number(document.getElementById("passMark")?.value || 0);
      const status = document.getElementById("examStatus")?.value || "Pending";

      if (!examId || !subjectCode || !durationMinutes) {
        showAlert("createAlert", "Please fill in all required fields.", "error");
        return;
      }

      try {
        await apiJson("/exams", {
          method: "POST",
          body: JSON.stringify({
            examId,
            subjectCode,
            durationMinutes,
            totalMarks,
            passCriteriaPercent,
            status,
          }),
        });
        showAlert("createAlert", `Exam "${examId}" created successfully!`, "success");
        createForm.reset();
        document.getElementById("examStatus").value = "Pending";
        await renderExamTable();
      } catch (err) {
        showAlert("createAlert", err.message || "Failed to create exam.", "error");
      }
    });
    wireExamTableActions("createAlert");
  }

  const editForm = document.getElementById("editExamForm");
  if (editForm) {
    const closeEdit = document.getElementById("closeEditModal");
    if (closeEdit) closeEdit.addEventListener("click", closeEditModal);
    const editModal = document.getElementById("editExamModal");
    if (editModal) {
      editModal.addEventListener("click", (e) => {
        if (e.target === editModal) closeEditModal();
      });
    }

    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const examId = document.getElementById("examId").value.trim();
      const durationMinutes = Number(document.getElementById("newDuration").value);
      const totalMarksRaw = document.getElementById("newMarks")?.value;
      const totalMarks = totalMarksRaw !== "" ? Number(totalMarksRaw) : undefined;
      const status = document.getElementById("newStatus")?.value?.trim();

      if (!examId || !durationMinutes) {
        showAlert("editAlert", "Please fill in all required fields.", "error");
        return;
      }

      try {
        await apiJson(`/exams/${encodeURIComponent(examId)}`, {
          method: "PUT",
          body: JSON.stringify({
            durationMinutes,
            ...(totalMarks === undefined ? {} : { totalMarks }),
            ...(status ? { status } : {}),
          }),
        });
        showAlert("editAlert", `Exam "${examId}" updated successfully!`, "success");
        closeEditModal();
        await renderExamTable();
      } catch (err) {
        showAlert("editAlert", err.message || "Failed to update exam.", "error");
      }
    });

    const deleteSelectedButton = document.getElementById("deleteSelectedExam");
    if (deleteSelectedButton) {
      deleteSelectedButton.addEventListener("click", async () => {
        const examId = document.getElementById("examId").value.trim();
        if (!examId) {
          showAlert("editAlert", "Enter or select an exam ID first.", "error");
          return;
        }
        await deleteExamById(examId, "editAlert");
      });
    }
    wireExamTableActions("editAlert");
  }

  const questionForm = document.getElementById("questionForm");
  if (questionForm) {
    const questionType = document.getElementById("questionType");
    const mcqFields = document.getElementById("mcqFields");
    const shortFields = document.getElementById("shortFields");
    const examSelect = document.getElementById("questionExamId");
    const subjectFilter = document.getElementById("subjectFilter");
    const applyFilter = document.getElementById("applyFilter");
    const clearFilter = document.getElementById("clearFilter");
    const cards = document.getElementById("questionCards");
    const empty = document.getElementById("questionEmpty");

    function toggleQuestionType() {
      const mode = questionType.value;
      mcqFields.style.display = mode === "MCQ" ? "" : "none";
      shortFields.style.display = mode === "SHORT" ? "" : "none";
    }

    function formatQuestionAnswer(question) {
      if (question.type === "SHORT") return question.expectedAnswer || "—";
      try {
        const opts = question.optionsJson ? JSON.parse(question.optionsJson) : [];
        if (Array.isArray(opts) && typeof question.correctIndex === "number" && question.correctIndex >= 0) {
          const answer = opts[question.correctIndex] ?? `Option ${question.correctIndex + 1}`;
          return `(${question.correctIndex + 1}) ${answer}`;
        }
      } catch {}
      return "—";
    }

    async function refreshExamOptions() {
      try {
        const exams = await apiJson("/exams");
        examsCache = Array.isArray(exams) ? exams : [];
        examSelect.innerHTML = `<option value="">—</option>${(exams || [])
          .map((exam) => `<option value="${escapeHtml(exam.examId)}">${escapeHtml(exam.examId)}</option>`)
          .join("")}`;
      } catch {}
    }

    async function renderQuestions(subjectCode) {
      try {
        const query = subjectCode ? `?subjectCode=${encodeURIComponent(subjectCode)}` : "";
        const list = await apiJson(`/questions${query}`);
        if (!Array.isArray(list) || list.length === 0) {
          cards.innerHTML = "";
          empty.style.display = "block";
          return;
        }

        empty.style.display = "none";
        cards.innerHTML = list
          .map(
            (q) => `
          <article class="question-card">
            <div class="question-top">
              <span class="${q.type === "MCQ" ? "badge badge-purple" : "badge badge-green"}">${escapeHtml(q.type)}</span>
              <strong>${escapeHtml(String(q.marks))} pts</strong>
            </div>
            <h3>${escapeHtml(q.text)}</h3>
            <div class="question-meta">
              <div><span>Code</span><strong>${escapeHtml(q.questionCode)}</strong></div>
              <div><span>Subject</span><strong>${escapeHtml(q.subjectCode)}</strong></div>
            </div>
            <div class="question-answer">
              <span>Answer</span>
              <strong>${escapeHtml(formatQuestionAnswer(q))}</strong>
            </div>
            <div class="form-actions" style="margin-top:10px; padding-top:0; border-top:0;">
              <button type="button" class="btn btn-danger btn-sm" data-question-id="${escapeHtml(String(q.id))}">Delete</button>
            </div>
          </article>
        `
          )
          .join("");
      } catch (err) {
        cards.innerHTML = "";
        empty.style.display = "block";
        showAlert("questionAlert", err.message || "Failed to load questions.", "error");
      }
    }

    questionType.addEventListener("change", toggleQuestionType);
    examSelect.addEventListener("change", () => {
      if (!examSelect.value) return;
      const picked = examsCache.find((exam) => exam.examId === examSelect.value);
      if (picked?.subjectCode) {
        document.getElementById("questionSubjectCode").value = picked.subjectCode;
      }
    });
    applyFilter.addEventListener("click", () => renderQuestions(subjectFilter.value.trim()));
    clearFilter.addEventListener("click", () => {
      subjectFilter.value = "";
      renderQuestions("");
    });

    cards.addEventListener("click", async (e) => {
      const btn = e.target?.closest?.("button[data-question-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-question-id");
      if (!id) return;
      showConfirmDialog("Delete this question?", async () => {
        try {
          await apiJson(`/questions/${encodeURIComponent(id)}`, { method: "DELETE" });
          showAlert("questionAlert", "Question deleted.", "success");
          await renderQuestions(subjectFilter.value.trim());
        } catch (err) {
          showAlert("questionAlert", err.message || "Failed to delete question.", "error");
        }
      });
    });

    questionForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const mode = questionType.value;
      const payload = {
        questionCode: document.getElementById("questionCode").value.trim(),
        subjectCode: document.getElementById("questionSubjectCode").value.trim(),
        text: document.getElementById("questionText").value.trim(),
        marks: Number(document.getElementById("questionMarks").value || 1),
        examId: examSelect.value || null,
      };

      if (!payload.questionCode || !payload.subjectCode || !payload.text || payload.marks < 1) {
        showAlert("questionAlert", "Please fill question code, subject, text and marks.", "error");
        return;
      }

      try {
        if (mode === "MCQ") {
          const options = [
            document.getElementById("option1").value.trim(),
            document.getElementById("option2").value.trim(),
            document.getElementById("option3").value.trim(),
            document.getElementById("option4").value.trim(),
          ].filter(Boolean);
          if (options.length < 2) {
            showAlert("questionAlert", "MCQ needs at least 2 options.", "error");
            return;
          }
          await apiJson("/questions/mcq", {
            method: "POST",
            body: JSON.stringify({
              ...payload,
              options,
              correctIndex: Number(document.getElementById("correctIndex").value || 0),
            }),
          });
        } else {
          const expectedAnswer = document.getElementById("expectedAnswer").value.trim();
          if (!expectedAnswer) {
            showAlert("questionAlert", "Expected answer is required for short questions.", "error");
            return;
          }
          await apiJson("/questions/short", {
            method: "POST",
            body: JSON.stringify({
              ...payload,
              expectedAnswer,
            }),
          });
        }
        showAlert("questionAlert", "Question added successfully.", "success");
        questionForm.reset();
        document.getElementById("questionType").value = "MCQ";
        toggleQuestionType();
        await renderQuestions(subjectFilter.value.trim());
      } catch (err) {
        showAlert("questionAlert", err.message || "Failed to add question.", "error");
      }
    });

    toggleQuestionType();
    refreshExamOptions();
    renderQuestions("");
  }

  renderExamTable();

  if (document.getElementById("editExamForm") && window.location.search.includes("examId=")) {
    const params = new URLSearchParams(window.location.search);
    const examId = params.get("examId");
    if (examId) {
      (async () => {
        try {
          const ex = await apiJson(`/exams/${encodeURIComponent(examId)}`);
          document.getElementById("examId").value = ex.examId || "";
          document.getElementById("newDuration").value = ex.durationMinutes ?? "";
          const marksEl = document.getElementById("newMarks");
          if (marksEl) marksEl.value = ex.totalMarks ?? "";
          const statusEl = document.getElementById("newStatus");
          if (statusEl) statusEl.value = ex.status || "Pending";
          openEditModal();
        } catch (err) {
          showAlert("editAlert", err.message || "Failed to load exam.", "error");
        }
      })();
    }
  }
});

function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `alert alert-${type} show`;
  setTimeout(() => el.classList.remove("show"), 4000);
}