'use client';
import { useState, type FormEvent } from 'react';
export default function LoginForm({ admin = false, returnTo = '/watch/index.html' }: { admin?: boolean; returnTo?: string }) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.get('email'), password: data.get('password'), returnTo: admin ? '/admin' : returnTo }) });
      const body = await response.json() as { error?: string; returnTo?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to sign in.');
      window.location.assign(body.returnTo || (admin ? '/admin' : '/watch/index.html'));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in.'); setBusy(false); }
  }
  return <><form onSubmit={submit} className="admin-form">
    <label>Email<input name="email" type="email" autoComplete="username" required maxLength={254} /></label>
    <label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={12} maxLength={256} /></label>
    {register && <p className="admin-muted">Use at least 12 characters. Your email is used as your account name; email verification is not enabled.</p>}
    {error && <p className="admin-error" role="alert">{error}</p>}
    <button className="admin-button" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
  </form>{!admin && <button className="admin-secondary" style={{ marginTop: 20, width: '100%' }} disabled={busy} onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Already a member? Sign in' : 'New here? Create an account'}</button>}</>;
}
