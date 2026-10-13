import { getUser } from '../session-auth';
import LoginForm from '../login/form';
import { redirect } from 'next/navigation';
import '../admin/admin.css';

export const dynamic = 'force-dynamic';
export default async function AdminLogin() {
  const user = await getUser();
  if (user?.admin) redirect('/admin');
  return <main className="admin-shell login-shell"><section className="admin-card login-card">
    <a className="admin-brand" href="/">RED<span>X</span></a>
    <p className="admin-eyebrow">ADMIN STUDIO</p><h1>Manage your collection.</h1>
    <p className="admin-muted">Sign in with your administrator email and password to publish videos and manage premium members.</p>
    {user && <p className="admin-error" role="alert">{user.email} does not have administrator access. Sign out and use the administrator account.</p>}
    <LoginForm admin />
    <a className="admin-back" href="/">← Back to the library</a>
  </section></main>;
}
