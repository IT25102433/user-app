/**
 * Auth API + localStorage + sessionStorage (userEmail, userRole).
 * POST /api/auth/register, POST /api/auth/login
 *
 * On Vite: same-origin /api/auth → proxied to Spring Boot (127.0.0.1:8081).
 * file:// opens: http://127.0.0.1:8081/api/auth
 */
function getAuthApiBase() {
  const proto = window.location.protocol;
  const override = (() => {
    try {
      return localStorage.getItem("AUTH_API_BASE");
    } catch {
      return null;
    }
  })();
  if (override && override.startsWith("http")) {
    return override.replace(/\/+$/, "");
  }
  if (proto === "file:" || proto === "null:" || !window.location.origin || window.location.origin === "null") {
    return "http://127.0.0.1:8081/api/auth";
  }
  return `${window.location.origin}/api/auth`;
}

function errorMessageFromJson(data) {
  if (!data || typeof data !== "object") return null;
  let msg = data.message || data.error || null;
  if (data.fields && typeof data.fields === "object") {
    const parts = Object.entries(data.fields).map(([k, v]) => `${k}: ${v}`);
    if (parts.length) msg = (msg || "Validation failed") + ` (${parts.join("; ")})`;
  }
  return msg ? String(msg) : null;
}

function authDebug(...args) {
  console.log("[auth]", ...args);
}

/**
 * Path prefix for HTML under …/pages/ (supports /pages/… or /myapp/pages/…).
 */
function getPagesBasePath() {
  const path = window.location.pathname || "";
  const marker = "/pages/";
  const idx = path.indexOf(marker);
  if (idx >= 0) {
    return path.slice(0, idx) + "/pages";
  }
  return "/pages";
}

/**
 * Full URL to a file under pages/, e.g. "auth/login.html", "exams/create-exam.html".
 */
function appPageUrl(relativeUnderPages) {
  const clean = String(relativeUnderPages || "").replace(/^\/+/, "");
  if (window.location.protocol === "file:") {
    return new URL("../" + clean, window.location.href).href;
  }
  const base = getPagesBasePath().replace(/\/$/, "");
  const pathOnly = `${base}/${clean}`.replace(/([^:]\/)\/+/g, "$1");
  return `${window.location.origin}${pathOnly}`;
}

function setLoggedInUser(email, role) {
  const e = (email || "").trim().toLowerCase();
  const r = (role || "").trim().toUpperCase();
  localStorage.setItem("userEmail", e);
  localStorage.setItem("userRole", r);
  try {
    sessionStorage.setItem("userEmail", e);
    sessionStorage.setItem("userRole", r);
  } catch {
    /* ignore */
  }
}

function clearLoggedInUser() {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  try {
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userRole");
  } catch {
    /* ignore */
  }
}

function getLoggedInUser() {
  const email =
    localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
  const role =
    localStorage.getItem("userRole") || sessionStorage.getItem("userRole");
  if (!email || !role) return null;
  return { email, role };
}

/**
 * ADMIN → admin dashboard (hub for all components)
 * USER → student placeholder (Member 3 builds live exams separately)
 */
function redirectAfterLogin(role) {
  const r = (role || "").toUpperCase();
  if (r === "ADMIN") {
    window.location.href = appPageUrl("auth/admin-dashboard.html");
    return;
  }
  if (r === "USER") {
    window.location.href = appPageUrl("auth/student-home.html");
    return;
  }
  window.location.href = appPageUrl("auth/login.html");
}

window.appPageUrl = appPageUrl;
window.getPagesBasePath = getPagesBasePath;

async function parseError(res) {
  try {
    const data = await res.json();
    return errorMessageFromJson(data) || "Request failed";
  } catch {
    return "Request failed";
  }
}

async function registerUser() {
  const fullName = document.getElementById("fullName")?.value?.trim() ?? "";
  const email = document.getElementById("email")?.value?.trim() ?? "";
  const password = document.getElementById("password")?.value ?? "";
  const roleSelect = document.getElementById("role");
  const role = roleSelect ? roleSelect.value.trim().toUpperCase() : "";
  const msg = document.getElementById("registerMsg");
  if (!msg) {
    console.error("[auth] registerMsg element missing");
    return;
  }

  if (!fullName || !email || !password || !role) {
    msg.innerText = "Please fill all fields and choose a role.";
    return;
  }

  const url = `${getAuthApiBase()}/register`;
  msg.innerText = "Registering…";
  authDebug("register POST", url, { email, role });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, role }),
    });

    authDebug("register response", res.status, res.statusText);

    if (!res.ok) {
      const errText = await parseError(res);
      authDebug("register error body", errText);
      msg.innerText = errText;
      return;
    }

    msg.innerText = "Registered successfully. Redirecting to login…";
    setTimeout(() => {
      window.location.href = appPageUrl("auth/login.html");
    }, 600);
  } catch (e) {
    authDebug("register fetch threw", e);
    msg.innerText =
      "Cannot reach server. Run Spring Boot on 8081 and Vite dev with /api proxy, or open pages via http://localhost:5173/pages/…";
  }
}

async function loginUser() {
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const msg = document.getElementById("loginMsg");
  if (!emailInput || !passwordInput || !msg) {
    console.error("[auth] login form elements missing", { emailInput, passwordInput, msg });
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    msg.innerText = "Please enter email and password.";
    return;
  }

  const url = `${getAuthApiBase()}/login`;
  msg.innerText = "Signing in…";
  authDebug("login POST", url, { email });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    authDebug("login response", res.status, res.statusText);

    const text = await res.text();
    let data = {};
    try {
      if (text) data = JSON.parse(text);
    } catch {
      /* non-JSON body */
    }

    authDebug("login body", data);

    if (!res.ok) {
      const errText =
        errorMessageFromJson(data) || "Invalid email or password.";
      authDebug("login error", errText);
      msg.innerText = errText;
      return;
    }

    authDebug("login ok", { email: data.email, role: data.role });
    setLoggedInUser(data.email, data.role);
    redirectAfterLogin(data.role);
  } catch (e) {
    authDebug("login fetch threw", e);
    msg.innerText =
      "Cannot reach server. Run Spring Boot on 8081 and Vite dev with /api proxy, or open pages via http://localhost:5173/pages/…";
  }
}

function loadProfile() {
  const msg = document.getElementById("profileMsg");
  const user = getLoggedInUser();

  const emailField = document.getElementById("profileEmail");
  const roleField = document.getElementById("profileRole");

  if (!user) {
    if (msg) msg.innerText = "Not logged in. Please sign in first.";
    if (emailField) emailField.value = "";
    if (roleField) roleField.value = "";
    return;
  }

  if (emailField) emailField.value = user.email;
  if (roleField) roleField.value = user.role;
  if (msg) msg.innerText = "";
}

function logoutUser() {
  clearLoggedInUser();
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  window.location.href = appPageUrl("auth/login.html");
}

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname || "";
  if (path.includes("/pages/auth/profile.html") && !getLoggedInUser()) {
    window.location.replace(appPageUrl("auth/login.html"));
    return;
  }
  if (document.getElementById("profileEmail")) {
    loadProfile();
  }
});
