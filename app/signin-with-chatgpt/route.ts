import { safeReturnTo } from '../session-auth';
export function GET(req: Request) {
  const url = new URL(req.url); const login = new URL('/login', req.url);
  login.searchParams.set('return_to', safeReturnTo(url.searchParams.get('return_to')));
  return Response.redirect(login, 302);
}
