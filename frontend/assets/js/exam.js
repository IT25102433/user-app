
function getBackendOrigin() {
  const { protocol, origin } = window.location;
  if (protocol === "file:" || origin === "null" || !origin) {
    return "http://127.0.0.1:8081";
  }
  return origin;
}

/** Same rules as auth.js appPageUrl (exam pages may load without auth.js). */
function resolveAppPageUrl(relativeUnderPages) {
  if (typeof window.appPageUrl === "function") {
    return window.appPageUrl(relativeUnderPages);
  }
  const clean = String(relativeUnderPages || "").replace(/^\/+/, "");
  if (window.location.protocol === "file:") {
    return new URL("../" + clean, window.location.href).href;
  }
  const path = window.location.pathname || "";
  const marker = "/pages/";
  const idx = path.indexOf(marker);
  const base = (idx >= 0 ? path.slice(0, idx) + "/pages" : "/pages").replace(/\/$/, "");
  const pathOnly = `${base}/${clean}`.replace(/([^:]\/)\/+/g, "$1");
  return `${window.location.origin}${pathOnly}`;
}

(function guardExamPagesRequireAuth() {
  const email =
    localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
  const role =
    (localStorage.getItem("userRole") || sessionStorage.getItem("userRole") || "").toUpperCase();
  if (!email || !role) {
    window.location.replace(resolveAppPageUrl("auth/login.html"));
    return;
  }
  if (role === "USER") {
    window.location.replace(resolveAppPageUrl("auth/student-home.html"));
    return;
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = `${getBackendOrigin()}/api`;
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

  function toDateInputValue(value) {
    if (!value) return "";
    const str = String(value);
    if (str.includes("T")) return str.split("T")[0];
    return str;
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
            <td>${escapeHtml(e.examDate || "—")}</td>
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
            const examDateEl = document.getElementById("newExamDate");
            if (examDateEl) examDateEl.value = toDateInputValue(ex.examDate);
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
      const examDate = document.getElementById("examDate")?.value?.trim() || "";

      if (!examId || !subjectCode || !durationMinutes || !examDate) {
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
            examDate,
          }),
        });
        showAlert("createAlert", `Exam "${examId}" created successfully!`, "success");
        createForm.reset();
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
      const examDate = document.getElementById("newExamDate")?.value?.trim() || "";

      if (!examId || !durationMinutes || !examDate) {
        showAlert("editAlert", "Please fill in all required fields.", "error");
        return;
      }

      try {
        await apiJson(`/exams/${encodeURIComponent(examId)}`, {
          method: "PUT",
          body: JSON.stringify({
            durationMinutes,
            ...(totalMarks === undefined ? {} : { totalMarks }),
            examDate,
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
    let currentQuestions = [];
    const questionType = document.getElementById("questionType");
    const mcqFields = document.getElementById("mcqFields");
    const shortFields = document.getElementById("shortFields");
    const examSelect = document.getElementById("questionExamId");
    const subjectFilter = document.getElementById("subjectFilter");
    const applyFilter = document.getElementById("applyFilter");
    const clearFilter = document.getElementById("clearFilter");
    const downloadQuestions = document.getElementById("downloadQuestions");
    const cards = document.getElementById("questionCards");
    const empty = document.getElementById("questionEmpty");
    const editingQuestionId = document.getElementById("editingQuestionId");
    const questionSubmitBtn = document.getElementById("questionSubmitBtn");
    const cancelQuestionEdit = document.getElementById("cancelQuestionEdit");

    function questionExamId(q) {
      return (q.exam && q.exam.examId) || q.examId || "";
    }

    function resetQuestionEditMode() {
      if (editingQuestionId) editingQuestionId.value = "";
      if (questionSubmitBtn) questionSubmitBtn.textContent = "Add Question";
      if (cancelQuestionEdit) cancelQuestionEdit.style.display = "none";
      if (questionType) questionType.disabled = false;
    }

    function startQuestionEditMode(id) {
      if (editingQuestionId) editingQuestionId.value = String(id);
      if (questionSubmitBtn) questionSubmitBtn.textContent = "Save Changes";
      if (cancelQuestionEdit) cancelQuestionEdit.style.display = "";
      if (questionType) questionType.disabled = true;
    }

    function fillQuestionForm(q) {
      questionType.value = q.type === "SHORT" ? "SHORT" : "MCQ";
      toggleQuestionType();
      document.getElementById("questionCode").value = q.questionCode || "";
      document.getElementById("questionSubjectCode").value = q.subjectCode || "";
      document.getElementById("questionText").value = q.text || "";
      document.getElementById("questionMarks").value = String(q.marks ?? 1);
      examSelect.value = questionExamId(q);

      if (q.type === "MCQ") {
        let opts = [];
        try {
          opts = q.optionsJson ? JSON.parse(q.optionsJson) : [];
        } catch {}
        ["option1", "option2", "option3", "option4"].forEach((id, i) => {
          document.getElementById(id).value = opts[i] || "";
        });
        const storedCorrect = q.correctIndex ?? 1;
        document.getElementById("correctIndex").value = String(storedCorrect >= 1 ? storedCorrect : 1);
      } else {
        document.getElementById("expectedAnswer").value = q.expectedAnswer || "";
      }
    }

    function toggleQuestionType() {
      const mode = questionType.value;
      mcqFields.style.display = mode === "MCQ" ? "" : "none";
      shortFields.style.display = mode === "SHORT" ? "" : "none";
    }

    function formatQuestionAnswer(question) {
      if (question.type === "SHORT") return question.expectedAnswer || "—";
      try {
        const opts = question.optionsJson ? JSON.parse(question.optionsJson) : [];
        if (Array.isArray(opts) && typeof question.correctIndex === "number" && question.correctIndex >= 1) {
          const answer = opts[question.correctIndex - 1] ?? `Option ${question.correctIndex}`;
          return `(${question.correctIndex}) ${answer}`;
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
        currentQuestions = Array.isArray(list) ? list : [];
        if (!Array.isArray(list) || list.length === 0) {
          cards.innerHTML = "";
          empty.style.display = "block";
          return;
        }

        empty.style.display = "none";
        cards.innerHTML = list
          .map(
            (q) => `
          <article class="question-card question-card--compact">
            <div class="question-top">
              <span class="${q.type === "MCQ" ? "badge badge-purple" : "badge badge-green"}">${escapeHtml(q.type)}</span>
              <span class="question-card-marks">${escapeHtml(String(q.marks))} pts</span>
            </div>
            <p class="question-card-text">${escapeHtml(q.text)}</p>
            <p class="question-card-meta">${escapeHtml(q.questionCode)} · ${escapeHtml(q.subjectCode)}</p>
            <p class="question-card-answer">${escapeHtml(formatQuestionAnswer(q))}</p>
            <div class="question-card-actions">
              <button type="button" class="btn btn-outline btn-sm" data-action="edit" data-question-id="${escapeHtml(String(q.id))}">Edit</button>
              <button type="button" class="btn btn-danger btn-sm" data-action="delete" data-question-id="${escapeHtml(String(q.id))}">Delete</button>
            </div>
          </article>
        `
          )
          .join("");
      } catch (err) {
        currentQuestions = [];
        cards.innerHTML = "";
        empty.style.display = "block";
        showAlert("questionAlert", err.message || "Failed to load questions.", "error");
      }
    }

    function downloadQuestionsPdf() {
      if (!Array.isArray(currentQuestions) || currentQuestions.length === 0) {
        showAlert("questionAlert", "No questions available to download.", "error");
        return;
      }

      const jsPdfLib = window.jspdf?.jsPDF;
      if (!jsPdfLib) {
        showAlert("questionAlert", "PDF library not loaded. Refresh and try again.", "error");
        return;
      }

      const doc = new jsPdfLib({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const maxTextWidth = pageWidth - margin * 2;
      let y = margin;

      const ensureSpace = (needed = 20) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const addWrappedLine = (label, value) => {
        const line = `${label}: ${value || "—"}`;
        const lines = doc.splitTextToSize(line, maxTextWidth);
        ensureSpace(lines.length * 16);
        doc.text(lines, margin, y);
        y += lines.length * 16;
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Question Bank Export", margin, y);
      y += 24;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const filter = subjectFilter?.value?.trim();
      addWrappedLine("Filter", filter || "All Subjects");
      addWrappedLine("Total Questions", String(currentQuestions.length));
      y += 8;

      currentQuestions.forEach((q, index) => {
        ensureSpace(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`${index + 1}. ${q.questionCode || "Question"}`, margin, y);
        y += 18;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        addWrappedLine("Subject", q.subjectCode || "");
        addWrappedLine("Type", q.type || "");
        addWrappedLine("Marks", String(q.marks ?? ""));
        addWrappedLine("Exam ID", q.examId || "");
        addWrappedLine("Question", q.text || "");

        if (q.type === "MCQ") {
          let optionsText = "";
          let answerText = "";
          try {
            const opts = q.optionsJson ? JSON.parse(q.optionsJson) : [];
            if (Array.isArray(opts)) {
              optionsText = opts.map((opt, i) => `${i + 1}) ${opt}`).join(" | ");
              if (typeof q.correctIndex === "number" && q.correctIndex >= 1 && q.correctIndex <= opts.length) {
                answerText = `${q.correctIndex}) ${opts[q.correctIndex - 1]}`;
              }
            }
          } catch {}
          addWrappedLine("Options", optionsText);
          addWrappedLine("Correct", answerText);
        } else {
          addWrappedLine("Expected Answer", q.expectedAnswer || "");
        }

        y += 10;
        ensureSpace(16);
        doc.setDrawColor(220);
        doc.line(margin, y, pageWidth - margin, y);
        y += 16;
      });

      const suffix = filter ? `-${filter}` : "-all";
      doc.save(`questions${suffix}.pdf`);
      showAlert("questionAlert", "Questions PDF downloaded successfully.", "success");
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
    if (downloadQuestions) {
      downloadQuestions.addEventListener("click", downloadQuestionsPdf);
    }

    cards.addEventListener("click", async (e) => {
      const btn = e.target?.closest?.("button[data-question-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-question-id");
      const action = btn.getAttribute("data-action");
      if (!id) return;

      if (action === "edit") {
        let q = currentQuestions.find((item) => String(item.id) === String(id));
        if (!q) {
          try {
            q = await apiJson(`/questions/${encodeURIComponent(id)}`);
          } catch (err) {
            showAlert("questionAlert", err.message || "Failed to load question.", "error");
            return;
          }
        }
        fillQuestionForm(q);
        startQuestionEditMode(id);
        questionForm.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (action === "delete") {
        showConfirmDialog("Delete this question?", async () => {
          try {
            await apiJson(`/questions/${encodeURIComponent(id)}`, { method: "DELETE" });
            if (editingQuestionId && editingQuestionId.value === String(id)) {
              questionForm.reset();
              resetQuestionEditMode();
              document.getElementById("questionType").value = "MCQ";
              toggleQuestionType();
            }
            showAlert("questionAlert", "Question deleted.", "success");
            await renderQuestions(subjectFilter.value.trim());
          } catch (err) {
            showAlert("questionAlert", err.message || "Failed to delete question.", "error");
          }
        });
      }
    });

    if (cancelQuestionEdit) {
      cancelQuestionEdit.addEventListener("click", () => {
        questionForm.reset();
        resetQuestionEditMode();
        document.getElementById("questionType").value = "MCQ";
        toggleQuestionType();
      });
    }

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

      const editId = editingQuestionId?.value?.trim();

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
          const correctIndex = Number(document.getElementById("correctIndex").value || 1);
          if (correctIndex < 1 || correctIndex > options.length) {
            showAlert(
              "questionAlert",
              `Correct option must be between 1 and ${options.length}.`,
              "error"
            );
            return;
          }
          const body = JSON.stringify({
            ...payload,
            options,
            correctIndex,
          });
          if (editId) {
            await apiJson(`/questions/${encodeURIComponent(editId)}/mcq`, { method: "PUT", body });
          } else {
            await apiJson("/questions/mcq", { method: "POST", body });
          }
        } else {
          const expectedAnswer = document.getElementById("expectedAnswer").value.trim();
          if (!expectedAnswer) {
            showAlert("questionAlert", "Expected answer is required for short questions.", "error");
            return;
          }
          const body = JSON.stringify({ ...payload, expectedAnswer });
          if (editId) {
            await apiJson(`/questions/${encodeURIComponent(editId)}/short`, { method: "PUT", body });
          } else {
            await apiJson("/questions/short", { method: "POST", body });
          }
        }
        showAlert(
          "questionAlert",
          editId ? "Question updated successfully." : "Question added successfully.",
          "success"
        );
        questionForm.reset();
        resetQuestionEditMode();
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
          const examDateEl = document.getElementById("newExamDate");
          if (examDateEl) examDateEl.value = toDateInputValue(ex.examDate);
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