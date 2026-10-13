import { getChatGPTUser } from '../chatgpt-auth';
import { redirect } from 'next/navigation';
import AdminDashboard from './dashboard';
import './admin.css';

export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  const user = await getChatGPTUser();
  if (user?.email.toLowerCase() !== 'rajuit1396@gmail.com') redirect('/admin-login');
  return <AdminDashboard email={user.email} />;
}
