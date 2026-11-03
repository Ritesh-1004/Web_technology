// storage.js
// A small data-access layer around window.localStorage.
// Every report is one object inside a single array saved under STORAGE_KEY.
// Keeping all reads/writes here means no other file touches localStorage
// for reports.

import { isValidCoordinates } from './location';

const STORAGE_KEY = 'cleancity_reports';

export const STATUSES = ['Pending', 'In Progress', 'Resolved'];

/**
 * Older reports (or hand-edited data) may be missing newer fields.
 * This fills in safe defaults so the UI never crashes on missing data.
 */
function normalizeReport(raw) {
  const hasCoords = isValidCoordinates(raw.latitude, raw.longitude);
  return {
    ...raw,
    id: raw.id || raw.complaintId || String(raw.createdAt || Math.random()),
    complaintId: String(raw.complaintId || ''),
    issueType: raw.issueType || 'Not specified',
    description: raw.description || '',
    location: raw.location || '',
    status: STATUSES.includes(raw.status) ? raw.status : 'Pending',
    image: raw.image || null,
    createdAt: raw.createdAt || null,
    latitude: hasCoords ? Number(raw.latitude) : null,
    longitude: hasCoords ? Number(raw.longitude) : null,
    accuracy: raw.accuracy ?? null,
    // Before this version, coordinates only ever came from the GPS button.
    locationSource: raw.locationSource || (hasCoords ? 'gps' : 'manual')
  };
}

/** Read every report. Returns [] if nothing is saved or the data is corrupt. */
export function getReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map(normalizeReport);
  } catch (err) {
    console.error('Failed to read reports from localStorage:', err);
    return [];
  }
}

/** Save the full array. Returns { ok: true } or { ok: false, error }. */
function saveReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    return { ok: true };
  } catch (err) {
    console.error('Failed to save reports to localStorage:', err);
    const isQuota = err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014);
    return {
      ok: false,
      error: isQuota
        ? 'Browser storage is full, so the report could not be saved. Free up space (clear site data for this page) and try again.'
        : 'The report could not be saved because browser storage is not available.'
    };
  }
}

/** Add a new report (newest first). Returns { ok, error }. */
export function addReport(report) {
  const reports = getReports();
  reports.unshift(report);
  return saveReports(reports);
}

/** Find one report by its complaint ID, e.g. CC-2026-1001 */
export function getReportByComplaintId(complaintId) {
  const wanted = String(complaintId || '').trim().toLowerCase();
  if (!wanted) return undefined;
  return getReports().find((r) => r.complaintId.toLowerCase() === wanted);
}

/** Change a report's status (used by the officer dashboard). Returns { ok, error }. */
export function updateReportStatus(complaintId, newStatus) {
  if (!STATUSES.includes(newStatus)) {
    return { ok: false, error: 'Unknown status.' };
  }
  const reports = getReports();
  const index = reports.findIndex((r) => r.complaintId === complaintId);
  if (index === -1) return { ok: false, error: 'Report not found.' };
  reports[index].status = newStatus;
  reports[index].updatedAt = new Date().toISOString();
  return saveReports(reports);
}

/** Permanently delete reports by complaint ID (officer dashboard). Returns { ok, error, removed }. */
export function deleteReports(complaintIds) {
  const ids = new Set(complaintIds);
  const reports = getReports();
  const remaining = reports.filter((r) => !ids.has(r.complaintId));
  const removed = reports.length - remaining.length;
  if (removed === 0) return { ok: false, error: 'Report not found.', removed: 0 };
  const saved = saveReports(remaining);
  return saved.ok ? { ok: true, removed } : { ...saved, removed: 0 };
}

/**
 * One filter function used by both dashboards.
 * search   -> matches complaint ID, category or location text
 * status   -> 'All' or one of STATUSES
 * category -> 'All' or an issue type
 */
export function filterReports(reports, { search = '', status = 'All', category = 'All' } = {}) {
  const q = search.trim().toLowerCase();
  return reports.filter((r) => {
    if (status !== 'All' && r.status !== status) return false;
    if (category !== 'All' && r.issueType !== category) return false;
    if (!q) return true;
    return (
      r.complaintId.toLowerCase().includes(q) ||
      r.issueType.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q)
    );
  });
}

/** Counts used by the dashboard stat cards. */
export function getReportStats(reports = getReports()) {
  return {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    inProgress: reports.filter((r) => r.status === 'In Progress').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length
  };
}
