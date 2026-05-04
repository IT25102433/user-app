import React, { useEffect, useMemo, useState } from "react";

type Exam = {
  examId: string;
  subjectCode: string;
  durationMinutes: number;
  totalMarks: number;
  status: string;
  graceMinutes?: number;
  passCriteriaPercent?: number;
};

type Question = {
  id: number;
  questionCode: string;
  subjectCode: string;
  text: string;
  marks: number;
  type: string;
  optionsJson?: string;
  correctIndex?: number;
  expectedAnswer?: string;
  exam?: Exam | null;
};

const API_BASE = "http://localhost:8081/api";

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {}
    const msg = body?.message || body?.error || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function App() {
  const [tab, setTab] = useState<"createExam" | "editExam" | "questionBank">("createExam");

  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [notice, setNotice] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

  function toast(kind: "success" | "error", msg: string) {
    setNotice({ kind, msg });
    window.setTimeout(() => setNotice(null), 3500);
  }

  async function refreshExams() {
    const list = await apiJson<Exam[]>("/exams");
    setExams(list);
  }

  async function refreshQuestions(subjectCode?: string) {
    const qs = subjectCode ? `?subjectCode=${encodeURIComponent(subjectCode)}` : "";
    const list = await apiJson<Question[]>(`/questions${qs}`);
    setQuestions(list);
  }

  useEffect(() => {
    refreshExams().catch((e) => toast("error", e.message));
    refreshQuestions().catch((e) => toast("error", e.message));
  }, []);

  const examIds = useMemo(() => exams.map((e) => e.examId), [exams]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandIcon">E</div>
          <div>
            <div className="brandTitle">ExamSystem</div>
            <div className="brandSub">Component 02</div>
          </div>
        </div>

        <div className="navSection">Exam</div>
        <button className={tab === "createExam" ? "nav active" : "nav"} onClick={() => setTab("createExam")}>
          Create Exam
        </button>
        <button className={tab === "editExam" ? "nav active" : "nav"} onClick={() => setTab("editExam")}>
          Edit / Delete Exam
        </button>

        <div className="navSection">Questions</div>
        <button className={tab === "questionBank" ? "nav active" : "nav"} onClick={() => setTab("questionBank")}>
          Question Bank
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="title">{tab === "createExam" ? "Create Exam" : tab === "editExam" ? "Edit Exam" : "Question Bank"}</div>
          </div>
          <div className="chips">
            <div className="chip">
              Exams: <strong>{exams.length}</strong>
            </div>
            <div className="chip">
              Questions: <strong>{questions.length}</strong>
            </div>
          </div>
        </header>

        {notice && (
          <div className="toast" role="status" aria-live="polite">
            <div className={notice.kind === "success" ? "alert success" : "alert error"}>
              <div className="alertInner">
                <div className="alertIcon">{notice.kind === "success" ? "✓" : "!"}</div>
                <div>
                  <div className="alertTitle">{notice.kind === "success" ? "Success" : "Action failed"}</div>
                  <div>{notice.msg}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "createExam" && (
          <section className="stack">
            <CreateExam
              onCreated={async () => {
                await refreshExams();
                toast("success", "Exam created.");
              }}
              onError={(msg) => toast("error", msg)}
            />
            <ExamsTable exams={exams} onRefresh={() => refreshExams().catch((e) => toast("error", e.message))} />
          </section>
        )}

        {tab === "editExam" && (
          <EditExam
            exams={exams}
            onChanged={async () => {
              await refreshExams();
              toast("success", "Exam updated.");
            }}
            onDeleted={async () => {
              await refreshExams();
              toast("success", "Exam deleted.");
            }}
            onError={(msg) => toast("error", msg)}
          />
        )}

        {tab === "questionBank" && (
          <QuestionBank
            exams={exams}
            questions={questions}
            onCreated={async () => {
              await refreshQuestions();
              toast("success", "Question created.");
            }}
            onDeleted={async () => {
              await refreshQuestions();
              toast("success", "Question deleted.");
            }}
            onFilter={async (subject) => {
              await refreshQuestions(subject || undefined);
            }}
            onError={(msg) => toast("error", msg)}
          />
        )}

        <footer className="footer">
          <div>
            <strong>Exams</strong>: {examIds.length} · <strong>Questions</strong>: {questions.length}
          </div>
        </footer>
      </main>
    </div>
  );
}

function StatusBadge(props: { status: string }) {
  const normalized = (props.status || "").trim().toLowerCase();
  const kind =
    normalized === "active" ? "active" : normalized === "pending" ? "pending" : normalized === "closed" ? "closed" : "draft";
  return <span className={`statusBadge ${kind}`}>{props.status || "Draft"}</span>;
}

function ExamsTable(props: { exams: Exam[]; onRefresh: () => void }) {
  const [examIdFilter, setExamIdFilter] = useState("");
  const [subjectCodeFilter, setSubjectCodeFilter] = useState("");

  const filteredExams = props.exams.filter((e) => {
    const examMatches = !examIdFilter.trim() || e.examId.toLowerCase().includes(examIdFilter.trim().toLowerCase());
    const subjectMatches = !subjectCodeFilter.trim() || e.subjectCode.toLowerCase().includes(subjectCodeFilter.trim().toLowerCase());
    return examMatches && subjectMatches;
  });

  return (
    <section className="card">
      <div className="row spread">
        <h2 style={{ margin: 0 }}>Created Exams</h2>
        <button className="btn" onClick={props.onRefresh}>
          Refresh
        </button>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <Field label="Search by Exam ID" value={examIdFilter} onChange={setExamIdFilter} placeholder="EXAM-001" />
        <Field label="Search by Subject Code" value={subjectCodeFilter} onChange={setSubjectCodeFilter} placeholder="CS301" />
      </div>

      <div className="table exams">
        <div className="thead">
          <div>Exam ID</div>
          <div>Subject</div>
          <div>Duration</div>
          <div>Grace</div>
          <div>Total</div>
          <div>Status</div>
        </div>

        {filteredExams.map((e) => (
          <div key={e.examId} className="tr">
            <div style={{ fontWeight: 900 }}>{e.examId}</div>
            <div>{e.subjectCode}</div>
            <div>{e.durationMinutes} min</div>
            <div>{(e.graceMinutes ?? 10).toString()} min</div>
            <div>{e.totalMarks}</div>
            <div>
              <StatusBadge status={e.status} />
            </div>
          </div>
        ))}

        {filteredExams.length === 0 && (
          <div className="muted" style={{ padding: 12 }}>
            No exams found for this filter.
          </div>
        )}
      </div>
    </section>
  );
}

function CreateExam(props: { onCreated: () => void; onError: (msg: string) => void }) {
  const [examId, setExamId] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passCriteriaPercent, setPassCriteriaPercent] = useState(40);
  const [totalMarks, setTotalMarks] = useState(0);
  const [status, setStatus] = useState("Draft");
  const [busy, setBusy] = useState(false);

  return (
    <section className="card">
      <h2>New Exam</h2>
      <div className="grid">
        <Field label="Exam ID" value={examId} onChange={setExamId} placeholder="EXAM-001" />
        <Field label="Subject Code" value={subjectCode} onChange={setSubjectCode} placeholder="CS301" />
        <Field label="Duration (minutes)" type="number" value={String(durationMinutes)} onChange={(v) => setDurationMinutes(Number(v))} />
        <Field
          label="Pass Criteria (%)"
          type="number"
          value={String(passCriteriaPercent)}
          onChange={(v) => setPassCriteriaPercent(Number(v))}
        />
        <Field label="Total Marks" type="number" value={String(totalMarks)} onChange={(v) => setTotalMarks(Number(v))} />
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={["Draft", "Active", "Pending", "Closed"]}
        />
      </div>
      <div className="actions">
        <button
          className="btn primary"
          disabled={busy}
          onClick={async () => {
            if (!examId.trim() || !subjectCode.trim()) return props.onError("Exam ID and Subject Code are required.");
            setBusy(true);
            try {
              await apiJson("/exams", {
                method: "POST",
                body: JSON.stringify({ examId, subjectCode, durationMinutes, passCriteriaPercent, totalMarks, status }),
              });
              setExamId("");
              setSubjectCode("");
              setDurationMinutes(60);
              setPassCriteriaPercent(40);
              setTotalMarks(0);
              setStatus("Draft");
              props.onCreated();
            } catch (e: any) {
              props.onError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Creating..." : "Create Exam"}
        </button>
      </div>
    </section>
  );
}

function EditExam(props: {
  exams: Exam[];
  onChanged: () => void;
  onDeleted: () => void;
  onError: (msg: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingExam = props.exams.find((e) => e.examId === editingId) || null;
  const [subjectCode, setSubjectCode] = useState<string>("");
  const [graceMinutes, setGraceMinutes] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [totalMarks, setTotalMarks] = useState<number>(0);
  const [status, setStatus] = useState<string>("Draft");
  const [busy, setBusy] = useState(false);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
  const [examIdFilter, setExamIdFilter] = useState("");
  const [subjectCodeFilter, setSubjectCodeFilter] = useState("");

  const filteredExams = props.exams.filter((e) => {
    const examMatches = !examIdFilter.trim() || e.examId.toLowerCase().includes(examIdFilter.trim().toLowerCase());
    const subjectMatches = !subjectCodeFilter.trim() || e.subjectCode.toLowerCase().includes(subjectCodeFilter.trim().toLowerCase());
    return examMatches && subjectMatches;
  });

  useEffect(() => {
    if (!editingExam) return;
    setSubjectCode(editingExam.subjectCode);
    setGraceMinutes(editingExam.graceMinutes ?? 10);
    setDurationMinutes(editingExam.durationMinutes);
    setTotalMarks(editingExam.totalMarks);
    setStatus(editingExam.status);
  }, [editingExam?.examId]);

  return (
    <section className="card">
      <h2>Existing Exams</h2>
      <div className="row" style={{ marginTop: 8 }}>
        <Field label="Search by Exam ID" value={examIdFilter} onChange={setExamIdFilter} placeholder="EXAM-001" />
        <Field label="Search by Subject Code" value={subjectCodeFilter} onChange={setSubjectCodeFilter} placeholder="CS301" />
      </div>

      <div className="table exams examsManage">
        <div className="thead">
          <div>Exam ID</div>
          <div>Subject</div>
          <div>Duration</div>
          <div>Grace</div>
          <div>Total</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {filteredExams.map((e) => (
          <div key={e.examId} className="tr">
            <div style={{ fontWeight: 900 }}>{e.examId}</div>
            <div>{e.subjectCode}</div>
            <div>{e.durationMinutes} min</div>
            <div>{(e.graceMinutes ?? 10).toString()} min</div>
            <div>{e.totalMarks}</div>
            <div>
              <StatusBadge status={e.status} />
            </div>
            <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
              <button className="btn small" disabled={busy} onClick={() => setEditingId(e.examId)}>
                Edit
              </button>
              <button
                className="btn danger small"
                disabled={busy}
                onClick={() => setDeletingExam(e)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {filteredExams.length === 0 && (
          <div className="muted" style={{ padding: 12 }}>
            No exams found for this filter.
          </div>
        )}
      </div>

      {editingExam && (
        <div
          className="modalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Edit exam ${editingExam.examId}`}
          onMouseDown={(e) => {
            if (busy) return;
            if (e.target === e.currentTarget) setEditingId(null);
          }}
        >
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Edit Exam</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  <strong>{editingExam.examId}</strong> · {editingExam.subjectCode}
                </div>
              </div>
              <button className="btn small" disabled={busy} onClick={() => setEditingId(null)}>
                Close
              </button>
            </div>

            <div className="grid" style={{ marginTop: 12 }}>
              <Field label="Subject Code" value={subjectCode} onChange={setSubjectCode} placeholder="CS301" />
              <Field
                label="Grace Period (minutes)"
                type="number"
                value={String(graceMinutes)}
                onChange={(v) => setGraceMinutes(Number(v))}
              />
              <Field
                label="Duration (minutes)"
                type="number"
                value={String(durationMinutes)}
                onChange={(v) => setDurationMinutes(Number(v))}
              />
              <Field label="Total Marks" type="number" value={String(totalMarks)} onChange={(v) => setTotalMarks(Number(v))} />
              <Select label="Status" value={status} onChange={setStatus} options={["Draft", "Active", "Pending", "Closed"]} />
            </div>

            <div className="actions">
              <button
                className="btn primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await apiJson(`/exams/${encodeURIComponent(editingExam.examId)}`, {
                      method: "PUT",
                      body: JSON.stringify({ subjectCode, graceMinutes, durationMinutes, totalMarks, status }),
                    });
                    setEditingId(null);
                    props.onChanged();
                  } catch (err: any) {
                    props.onError(err.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingExam && (
        <ConfirmDeleteModal
          open={Boolean(deletingExam)}
          title="Delete exam?"
          message={`This will permanently delete exam "${deletingExam.examId}" (${deletingExam.subjectCode}).`}
          confirmText={busy ? "Deleting..." : "Delete Exam"}
          busy={busy}
          onCancel={() => setDeletingExam(null)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await apiJson(`/exams/${encodeURIComponent(deletingExam.examId)}`, { method: "DELETE" });
              setDeletingExam(null);
              props.onDeleted();
            } catch (err: any) {
              props.onError(err.message);
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </section>
  );
}

function QuestionBank(props: {
  exams: Exam[];
  questions: Question[];
  onCreated: () => void;
  onDeleted: () => void;
  onFilter: (subject: string) => void;
  onError: (msg: string) => void;
}) {
  const [subjectFilter, setSubjectFilter] = useState("");

  const [mode, setMode] = useState<"MCQ" | "SHORT">("MCQ");
  const [questionCode, setQuestionCode] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [text, setText] = useState("");
  const [marks, setMarks] = useState(1);
  const [examId, setExamId] = useState<string>("");

  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [expectedAnswer, setExpectedAnswer] = useState("");

  const [busy, setBusy] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (!examId) return;
    const exam = props.exams.find((e) => e.examId === examId);
    if (exam?.subjectCode) {
      setSubjectCode(exam.subjectCode);
    }
  }, [examId, props.exams]);

  return (
    <section className="stack">
      <div className="card">
        <h2>Create Question</h2>
        <div className="row">
          <Select label="Type" value={mode} onChange={(v) => setMode(v as any)} options={["MCQ", "SHORT"]} />
          <Select label="Attach to Exam (optional)" value={examId} onChange={setExamId} options={["", ...props.exams.map((e) => e.examId)]} />
        </div>
        <div className="grid">
          <Field label="Question Code" value={questionCode} onChange={setQuestionCode} placeholder="Q001" />
          <Field label="Subject Code" value={subjectCode} onChange={setSubjectCode} placeholder="CS301" />
          <Field label="Marks" type="number" value={String(marks)} onChange={(v) => setMarks(Number(v))} />
          <div className="field full">
            <label>Question Text</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type the question..." />
          </div>

          {mode === "MCQ" ? (
            <>
              {options.map((opt, idx) => (
                <Field
                  key={idx}
                  label={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(v) => setOptions((prev) => prev.map((x, i) => (i === idx ? v : x)))}
                />
              ))}
              <Select
                label="Correct Option"
                value={String(correctIndex + 1)}
                onChange={(v) => setCorrectIndex(Number(v) - 1)}
                options={options.map((_, i) => String(i + 1))}
              />
            </>
          ) : (
            <div className="field full">
              <label>Expected Answer</label>
              <textarea value={expectedAnswer} onChange={(e) => setExpectedAnswer(e.target.value)} placeholder="Model answer..." />
            </div>
          )}
        </div>
        <div className="actions">
          <button
            className="btn primary"
            disabled={busy}
            onClick={async () => {
              if (!questionCode.trim() || !subjectCode.trim() || !text.trim()) {
                return props.onError("Question Code, Subject Code, and Text are required.");
              }
              setBusy(true);
              try {
                if (mode === "MCQ") {
                  const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
                  await apiJson("/questions/mcq", {
                    method: "POST",
                    body: JSON.stringify({
                      questionCode,
                      subjectCode,
                      text,
                      marks,
                      options: cleanOptions,
                      correctIndex,
                      examId: examId || null,
                    }),
                  });
                } else {
                  await apiJson("/questions/short", {
                    method: "POST",
                    body: JSON.stringify({
                      questionCode,
                      subjectCode,
                      text,
                      marks,
                      expectedAnswer,
                      examId: examId || null,
                    }),
                  });
                }
                setQuestionCode("");
                setSubjectCode("");
                setText("");
                setMarks(1);
                setExamId("");
                setOptions(["", "", "", ""]);
                setCorrectIndex(0);
                setExpectedAnswer("");
                props.onCreated();
              } catch (e: any) {
                props.onError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving..." : "Add Question"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="row spread">
          <h2>Question Bank</h2>
          <div className="row" style={{ gap: 10 }}>
            <Field label="Filter by Subject" value={subjectFilter} onChange={setSubjectFilter} placeholder="CS301" />
            <button className="btn" onClick={() => props.onFilter(subjectFilter.trim())}>
              Apply
            </button>
            <button className="btn" onClick={() => (setSubjectFilter(""), props.onFilter(""))}>
              Clear
            </button>
          </div>
        </div>

        <div className="questionCards">
          {props.questions.map((q) => (
            <article key={q.id} className="questionCard">
              <div className="questionMeta">
                <span className={q.type === "MCQ" ? "questionType mcq" : "questionType short"}>{q.type}</span>
                <span className="questionMarks">{q.marks} pts</span>
              </div>

              <h3 className="questionText">{q.text}</h3>

              <div className="questionFields">
                <div>
                  <span className="qLabel">Code</span>
                  <span className="qValue">{q.questionCode}</span>
                </div>
                <div>
                  <span className="qLabel">Subject</span>
                  <span className="qValue">{q.subjectCode}</span>
                </div>
                <div className="full">
                  <span className="qLabel">Answer</span>
                  <span className="qValue">{formatQuestionAnswer(q)}</span>
                </div>
              </div>

              <div className="actions">
                <button
                  className="btn danger small"
                  disabled={busy}
                  onClick={() => setDeletingQuestion(q)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
        {props.questions.length === 0 && <div className="muted">No questions found.</div>}
      </div>

      {deletingQuestion && (
        <ConfirmDeleteModal
          open={Boolean(deletingQuestion)}
          title="Delete question?"
          message={`Delete question "${deletingQuestion.questionCode}" for subject "${deletingQuestion.subjectCode}"?`}
          confirmText={busy ? "Deleting..." : "Delete Question"}
          busy={busy}
          onCancel={() => setDeletingQuestion(null)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await apiJson(`/questions/${deletingQuestion.id}`, { method: "DELETE" });
              setDeletingQuestion(null);
              props.onDeleted();
            } catch (e: any) {
              props.onError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </section>
  );
}

function ConfirmDeleteModal(props: {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!props.open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label={props.title} onMouseDown={(e) => e.target === e.currentTarget && props.onCancel()}>
      <div className="modal confirmModal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="confirmIcon">!</div>
        <div className="modalTitle">{props.title}</div>
        <div className="muted" style={{ marginTop: 6 }}>
          {props.message}
        </div>
        <div className="actions" style={{ marginTop: 16 }}>
          <button className="btn" disabled={props.busy} onClick={props.onCancel}>
            Cancel
          </button>
          <button className="btn danger" disabled={props.busy} onClick={props.onConfirm}>
            {props.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatQuestionAnswer(q: Question) {
  if (q.type === "SHORT") {
    return q.expectedAnswer?.trim() || "—";
  }

  if (q.type === "MCQ") {
    try {
      const parsed = q.optionsJson ? (JSON.parse(q.optionsJson) as string[]) : [];
      const idx = typeof q.correctIndex === "number" ? q.correctIndex : -1;
      if (idx >= 0 && idx < parsed.length) {
        return `(${idx + 1}) ${parsed[idx]}`;
      }
      if (idx >= 0) {
        return `Option ${idx + 1}`;
      }
    } catch {
      // Keep fallback if options JSON is malformed
    }
  }

  return "—";
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="field">
      <label>{props.label}</label>
      <input type={props.type || "text"} value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} />
    </div>
  );
}

function Select(props: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="field">
      <label>{props.label}</label>
      <select value={props.value} onChange={(e) => props.onChange(e.target.value)}>
        {props.options.map((o) => (
          <option key={o} value={o}>
            {o === "" ? "—" : o}
          </option>
        ))}
      </select>
    </div>
  );
}

