import { getUser } from '../session-auth';
import { redirect } from 'next/navigation';
import AdminDashboard from './dashboard';
import './admin.css';

export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  const user = await getUser();
  if (!user?.admin) redirect('/admin-login');
  return <AdminDashboard email={user.email} />;
}
