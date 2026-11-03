import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor, USING_DEFAULT_OFFICER_CODE, DEFAULT_OFFICER_CODE } from '../utils/auth';

const emptyForm = { name: '', identifier: '', password: '', confirm: '', officerCode: '' };

// First page every visitor sees: log in or register, as a citizen or an officer.
export default function Welcome() {
  const { session, login, register } = useAuth();
  const [params, setParams] = useSearchParams();
  const role = params.get('role') === 'officer' ? 'officer' : 'citizen';
  const mode = params.get('mode') === 'register' ? 'register' : 'login';

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to={homeFor(session.role)} replace />;

  const go = (next) => {
    setParams({ role, mode, ...next }, { replace: true });
    setForm(emptyForm);
    setError('');
  };
  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = mode === 'register'
      ? await register({ role, ...form })
      : await login({ role, identifier: form.identifier, password: form.password });
    setBusy(false);
    if (!res.ok) setError(res.error);
    // on success the session is set and this page redirects by itself
  };

  const isOfficer = role === 'officer';
  const idLabel = isOfficer ? 'Officer ID' : 'Email or mobile number';
  const idPlaceholder = isOfficer ? 'e.g. officer01' : 'you@example.com or 10-digit mobile';

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <span className="brand-mark" aria-hidden="true">CC</span>
        <div>
          <h1>CleanCity</h1>
          <p>Smart Waste Management</p>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="I am a">
          <button type="button" role="tab" aria-selected={!isOfficer} className={!isOfficer ? 'active' : ''} onClick={() => go({ role: 'citizen' })}>Citizen</button>
          <button type="button" role="tab" aria-selected={isOfficer} className={isOfficer ? 'active' : ''} onClick={() => go({ role: 'officer' })}>Officer</button>
        </div>

        <h2 className="auth-title">
          {mode === 'login' ? 'Log in' : 'Create account'} as {isOfficer ? 'an officer' : 'a citizen'}
        </h2>
        <p className="auth-sub">
          {isOfficer
            ? 'Review every report, update its status and manage the list.'
            : 'Report garbage with a photo and location, and track your own reports.'}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {error && <div className="form-error" role="alert">{error}</div>}

          {mode === 'register' && (
            <div className="field">
              <label htmlFor="auth-name">Full name</label>
              <input id="auth-name" type="text" autoComplete="name" value={form.name} onChange={(e) => setField('name', e.target.value)} />
            </div>
          )}

          <div className="field">
            <label htmlFor="auth-id">{idLabel}</label>
            <input id="auth-id" type={isOfficer ? 'text' : 'text'} autoComplete="username" placeholder={idPlaceholder} value={form.identifier} onChange={(e) => setField('identifier', e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="auth-pass">Password</label>
            <input id="auth-pass" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => setField('password', e.target.value)} />
          </div>

          {mode === 'register' && (
            <div className="field">
              <label htmlFor="auth-confirm">Confirm password</label>
              <input id="auth-confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setField('confirm', e.target.value)} />
            </div>
          )}

          {mode === 'register' && isOfficer && (
            <div className="field">
              <label htmlFor="auth-code">Officer registration code</label>
              <input id="auth-code" type="password" autoComplete="off" value={form.officerCode} onChange={(e) => setField('officerCode', e.target.value)} />
            </div>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>New here? <button type="button" className="link-button" onClick={() => go({ mode: 'register' })}>Create an account</button></>
          ) : (
            <>Already registered? <button type="button" className="link-button" onClick={() => go({ mode: 'login' })}>Log in</button></>
          )}
        </p>
      </div>

      {mode === 'register' && isOfficer && USING_DEFAULT_OFFICER_CODE && (
        <div className="demo-banner auth-note">
          Prototype notice: the demo officer registration code is <strong>{DEFAULT_OFFICER_CODE}</strong>.
          Set your own in a <code>.env</code> file before sharing this site.
        </div>
      )}
      <p className="auth-foot">Prototype: accounts are saved in this browser only.</p>
    </div>
  );
}
