'use client';
import { useState } from 'react';
import '../admin/admin.css';
export default function Logout() {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Unable to sign out. Please try again.');
      window.location.assign('/login');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign out.'); setBusy(false); }
  }
  return <main className="admin-shell login-shell"><section className="admin-card login-card"><h1>Sign out?</h1><p className="admin-muted">You can sign back in whenever you need.</p>{error && <p role="alert" className="admin-error">{error}</p>}<button className="admin-button" disabled={busy} onClick={() => void logout()}>{busy ? 'Signing out…' : 'Sign out'}</button><a className="admin-back" href="/">Back to the library</a></section></main>;
}
