import LoginForm from './form';
import { safeReturnTo } from '../session-auth';
import '../admin/admin.css';
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams: Promise<{ return_to?: string }> }) {
  const params = await searchParams;
  return <main className="admin-shell login-shell"><section className="admin-card login-card"><a className="admin-brand" href="/">xxx<span>r</span></a><p className="admin-eyebrow">MEMBER ACCESS</p><h1>Welcome to xxxr.</h1><p className="admin-muted">Sign in to your account. Contact the administrator to activate premium access.</p><LoginForm returnTo={safeReturnTo(params.return_to)} /><a className="admin-back" href="/">← Back to the library</a></section></main>;
}
