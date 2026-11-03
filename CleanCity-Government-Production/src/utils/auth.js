// auth.js
// Accounts and sessions for the two kinds of people who use CleanCity:
//   role 'citizen' - reports garbage and tracks their own reports
//   role 'officer' - sees all reports and updates / deletes them
//
// PROTOTYPE NOTICE: there is no backend, so accounts live in this browser's
// localStorage and passwords are stored as salted hashes. This separates the
// two dashboards and keeps people's reports apart, but it is NOT real
// security. For a real deployment, move register/login to a server.
//
// Officers must enter an "officer registration code" when they register, so a
// citizen cannot simply create an officer account. Change the code in .env:
//   VITE_OFFICER_CODE=your-secret-code

const ACCOUNTS_KEY = 'cleancity_accounts';
const SESSION_KEY = 'cleancity_session';
const SESSION_DAYS = { citizen: 30, officer: 1 };

const OFFICER_CODE = (import.meta.env.VITE_OFFICER_CODE || 'CLEANCITY-OFFICER').trim();
export const USING_DEFAULT_OFFICER_CODE = !import.meta.env.VITE_OFFICER_CODE;
export const DEFAULT_OFFICER_CODE = 'CLEANCITY-OFFICER';

export const homeFor = (role) => (role === 'officer' ? '/officer' : '/');

/* ------------------------------ helpers ------------------------------ */

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt, scheme) {
  const text = `${salt}:${password}`;
  if (scheme === 'sha256') {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return toHex(digest);
  }
  // Fallback for plain-http pages where crypto.subtle is unavailable
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

const hasSubtle = () => typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function';

function readAccounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function writeAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return true;
  } catch (err) {
    return false;
  }
}

function normalizeIdentifier(role, value) {
  const v = String(value || '').trim().toLowerCase();
  return role === 'citizen' ? v.replace(/[\s-]/g, '') : v;
}

function validateIdentifier(role, id) {
  if (role === 'citizen') {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(id);
    const isMobile = /^(\+?91)?[6-9]\d{9}$/.test(id);
    return isEmail || isMobile ? '' : 'Enter a valid email address or 10-digit mobile number.';
  }
  return /^[a-z0-9_-]{3,20}$/.test(id) ? '' : 'Officer ID must be 3-20 letters, numbers, - or _.';
}

function saveSession(account) {
  const session = {
    userId: account.id,
    role: account.role,
    name: account.name,
    identifier: account.identifier,
    expiresAt: Date.now() + SESSION_DAYS[account.role] * 24 * 3600 * 1000
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    return null;
  }
  return session;
}

/* ------------------------------- API -------------------------------- */

/** The signed-in person ({ userId, role, name, identifier }) or null. */
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.userId || !s.role || !s.expiresAt || Date.now() > s.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch (err) {
    return null;
  }
}

export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    /* nothing to clear */
  }
}

/** Creates an account and signs it in. Returns { ok, session } or { ok: false, error }. */
export async function registerAccount({ role, name, identifier, password, confirm, officerCode }) {
  if (role !== 'citizen' && role !== 'officer') return { ok: false, error: 'Choose Citizen or Officer.' };
  const cleanName = String(name || '').trim();
  if (cleanName.length < 2) return { ok: false, error: 'Please enter your full name.' };

  const id = normalizeIdentifier(role, identifier);
  const idError = validateIdentifier(role, id);
  if (idError) return { ok: false, error: idError };

  if (String(password || '').length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
  if (password !== confirm) return { ok: false, error: 'The two passwords do not match.' };

  if (role === 'officer' && String(officerCode || '').trim() !== OFFICER_CODE) {
    return { ok: false, error: 'Incorrect officer registration code. Ask your department for the code.' };
  }

  const accounts = readAccounts();
  if (accounts.some((a) => a.role === role && a.identifier === id)) {
    return { ok: false, error: role === 'officer' ? 'This Officer ID is already registered. Please log in.' : 'This email / mobile is already registered. Please log in.' };
  }

  const salt = newId();
  const scheme = hasSubtle() ? 'sha256' : 'basic';
  const account = {
    id: newId(),
    role,
    name: cleanName,
    identifier: id,
    salt,
    scheme,
    passwordHash: await hashPassword(password, salt, scheme),
    createdAt: new Date().toISOString()
  };
  if (!writeAccounts([...accounts, account])) {
    return { ok: false, error: 'Could not save the account. Please allow browser storage and try again.' };
  }
  const session = saveSession(account);
  return session ? { ok: true, session } : { ok: false, error: 'Account created, but the session could not be started. Please log in.' };
}

/** Returns { ok, session } or { ok: false, error }. */
export async function loginAccount({ role, identifier, password }) {
  const id = normalizeIdentifier(role, identifier);
  const generic = role === 'officer' ? 'Incorrect Officer ID or password.' : 'Incorrect email / mobile or password.';
  const account = readAccounts().find((a) => a.role === role && a.identifier === id);
  if (!account) return { ok: false, error: generic };
  if (account.scheme === 'sha256' && !hasSubtle()) {
    return { ok: false, error: 'This account needs a secure (https) page to log in.' };
  }
  const hash = await hashPassword(password || '', account.salt, account.scheme);
  if (hash !== account.passwordHash) return { ok: false, error: generic };
  const session = saveSession(account);
  return session ? { ok: true, session } : { ok: false, error: 'Could not start the session. Please allow browser storage.' };
}
