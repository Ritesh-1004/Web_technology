// complaintId.js
// Generates unique complaint IDs like CC-2026-1001.
// The next number is always one higher than the largest number already
// used by a saved report (or the saved counter), so IDs never repeat.

import { getReports } from './storage';

const SEQUENCE_KEY = 'cleancity_sequence';
const STARTING_NUMBER = 1000;

export function generateComplaintId() {
  let highest = STARTING_NUMBER;

  // 1. Largest number found in existing reports
  getReports().forEach((report) => {
    const match = /^CC-\d{4}-(\d+)$/.exec(report.complaintId);
    if (match) highest = Math.max(highest, Number(match[1]));
  });

  // 2. Or the saved counter, if it is higher
  try {
    const saved = parseInt(localStorage.getItem(SEQUENCE_KEY), 10);
    if (!Number.isNaN(saved)) highest = Math.max(highest, saved);
  } catch (err) {
    /* storage unavailable: the report-based number above is still unique */
  }

  const next = highest + 1;
  try {
    localStorage.setItem(SEQUENCE_KEY, String(next));
  } catch (err) {
    /* ignore: next call recomputes from saved reports */
  }

  return `CC-${new Date().getFullYear()}-${next}`;
}
