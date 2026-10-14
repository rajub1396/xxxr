'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

type Video = { id: string; title: string; description: string; category: string; premium: number; thumbnail: string };
type Member = { id: string; email: string; premium: number };
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : 'Unable to complete the request.');
  return body as T;
}
export default function AdminDashboard({ email }: { email: string }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState<'videos' | 'members'>('videos');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const load = useCallback(async () => {
    const [v, m] = await Promise.all([api<Video[]>('videos'), api<Member[]>('members')]);
    setVideos(v); setMembers(m);
  }, []);
  useEffect(() => { load().catch(e => setError(e.message)).finally(() => setLoading(false)); }, [load]);
  async function perform(action: () => Promise<unknown>, message: string) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); await load(); setNotice(message); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to complete the request.'); }
    finally { setBusy(false); }
  }
  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    await perform(async () => {
      await api('videos', { method: 'POST', body: JSON.stringify({ title: data.get('title'), embed: data.get('embed'), thumbnail: data.get('thumbnail'), description: data.get('description'), category: data.get('category'), premium: data.get('premium') === 'on' }) });
      form.reset();
    }, 'Video published.');
  }
  return <main className="admin-shell"><div className="admin-container">
    <header className="admin-header"><div><a className="admin-brand" href="/">xxx<span>r</span></a><p className="admin-muted">Admin Studio</p></div><div className="admin-account"><span>{email}</span><a href="/signout-with-chatgpt?return_to=%2Fadmin-login">Sign out</a></div></header>
    <div className="admin-heading"><div><p className="admin-eyebrow">YOUR CONTROL ROOM</p><h1>Collection overview</h1><p className="admin-muted">Publish new videos and control membership access.</p></div><a className="admin-secondary" href="/">View library ↗</a></div>
    <div className="admin-stats">{[['Videos', videos.length], ['Members', members.length], ['Premium members', members.filter(m => m.premium).length]].map(([label, count]) => <section className="admin-card" key={label}><span className="admin-muted">{label}</span><strong>{loading ? '—' : count}</strong></section>)}</div>
    {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-notice" role="status">{notice}</p>}
    <div className="admin-grid"><section className="admin-card"><h2>Publish a video</h2><p className="admin-muted">Add an HTTPS player link or iframe embed.</p><form onSubmit={publish} className="admin-form">
      <label>Title<input name="title" required maxLength={120} placeholder="Video title" /></label>
      <label>Embed link or iframe<textarea name="embed" required rows={3} placeholder="https://…" /></label>
      <label>Preview image URL (optional)<input name="thumbnail" type="url" placeholder="https://…/cover.jpg" /><span className="admin-muted">Leave empty to detect the video preview automatically.</span></label>
      <label>Description<textarea name="description" maxLength={1000} rows={3} placeholder="A short description" /></label>
      <label>Category<input name="category" maxLength={40} defaultValue="General" required /></label>
      <label className="admin-check"><input name="premium" type="checkbox" /> Premium members only</label>
      <button className="admin-button" disabled={busy || loading}>{busy ? 'Saving…' : 'Publish video'}</button>
    </form></section>
    <section className="admin-card"><div className="admin-tabs" role="group" aria-label="Manage collection"><button aria-pressed={tab === 'videos'} onClick={() => { setTab('videos'); setSearch(''); }}>Videos</button><button aria-pressed={tab === 'members'} onClick={() => { setTab('members'); setSearch(''); }}>Members</button></div>
      <input className="admin-search" aria-label={`Search ${tab}`} placeholder={`Search ${tab}…`} value={search} onChange={e => setSearch(e.target.value)} />
      {loading ? <p className="admin-muted" role="status">Loading your collection…</p> : <div className="admin-list">{tab === 'videos' ? videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase())).map(v => <article className="admin-row" key={v.id}><img className="admin-video-preview" src={v.thumbnail || "/video-placeholder.svg"} alt={`${v.title} preview`} loading="lazy" referrerPolicy="no-referrer" onError={e => { if (!e.currentTarget.src.endsWith("/video-placeholder.svg")) e.currentTarget.src = "/video-placeholder.svg"; }} /><div><h3>{v.title}</h3><p className="admin-muted">{v.category} · {v.premium ? 'Premium' : 'Free'}</p><details className="admin-preview-edit"><summary>Edit preview image</summary><form onSubmit={event => { event.preventDefault(); const thumbnail = new FormData(event.currentTarget).get("thumbnail"); void perform(() => api(`videos/${encodeURIComponent(v.id)}`, { method: "PATCH", body: JSON.stringify({ thumbnail }) }), "Preview image updated."); }}><label>HTTPS preview image URL<input name="thumbnail" type="url" aria-label={`Preview image for ${v.title}`} defaultValue={v.thumbnail?.startsWith("https://") ? v.thumbnail : ""} placeholder="Leave empty for automatic detection" /></label><button className="admin-secondary" disabled={busy}>Save preview</button></form></details></div><button className="admin-delete" disabled={busy} onClick={() => { if (window.confirm(`Delete “${v.title}”? This cannot be undone.`)) void perform(() => api(`videos/${encodeURIComponent(v.id)}`, { method: 'DELETE' }), 'Video deleted.'); }}>Delete</button></article>) : members.filter(m => m.email.toLowerCase().includes(search.toLowerCase())).map(m => <article className="admin-row" key={m.id}><div><h3>{m.email}</h3><p className="admin-muted">{m.premium ? 'Premium access' : 'Free member'}</p></div><button className="admin-secondary" disabled={busy} onClick={() => void perform(() => api(`members/${encodeURIComponent(m.id)}`, { method: 'PATCH', body: JSON.stringify({ premium: !m.premium }) }), 'Membership updated.')}>{m.premium ? 'Revoke premium' : 'Grant premium'}</button></article>)}
      {!(tab === 'videos' ? videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase())).length : members.filter(m => m.email.toLowerCase().includes(search.toLowerCase())).length) && <p className="admin-empty">{search ? 'No matching results.' : tab === 'videos' ? 'Publish your first video to start the collection.' : 'Members appear after signing in.'}</p>}</div>}
    </section></div>
  </div></main>;
}
