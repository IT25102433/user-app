/**
 * admin.js — Shared frontend utility functions for Admin Component
 * [Member 5 - Administrative Management]
 */

const ADMIN_API = '/exam-system/admin';

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiGet(action, params = {}) {
  const q = new URLSearchParams({ action, ...params });
  const res = await fetch(`${ADMIN_API}?${q}`);
  return res.json();
}

async function apiPost(action, params = {}) {
  const q = new URLSearchParams({ action, ...params });
  const res = await fetch(`${ADMIN_API}?${q}`, { method: 'POST' });
  return res.json();
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function showToast(message, type = '') {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function formatDate(ts) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'medium' }); }
  catch { return ts; }
}

function openModal(id)  { const el = document.getElementById(id); if (el) el.classList.add('open'); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('open'); }
