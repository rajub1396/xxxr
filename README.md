# RedX 18+ Video

Flutter Web frontend with a Node.js / Next.js API and Neon PostgreSQL database, hosted on Render. An 18+ confirmation screen appears before the library and remembers confirmation for the current browser tab session. This is self-declared age confirmation, not identity or age verification.

Admin entry: `/admin-login`. The protected `/admin` dashboard supports publishing and deleting videos, searching the collection, and granting or revoking premium membership. Sign in with the administrator email and password. API operations also enforce administrator authorization. Passwords use salted scrypt hashes. Database-backed sessions use random tokens in HttpOnly, Secure production cookies; only token hashes are stored. Identity headers from the former Sites host are never trusted. Login attempts are rate limited in PostgreSQL.

Admin: `rajuit1396@gmail.com` by default, configurable with `ADMIN_EMAIL`. Members sign in or create accounts at `/login`. Email verification and password recovery are not configured. Publish HTTPS embed links or paste iframe code, remove videos, and grant or revoke premium access. Only the iframe src URL is retained; supplied HTML is never rendered. YouTube and Vimeo share links are normalized automatically. Other providers require their player/embed URL and must permit iframe playback. Players run in a sandbox without top navigation or popups.

New videos appear immediately after publishing; other open browsers refresh every 30 seconds. Premium embed URLs are returned only after server authorization. No payment processor is configured: premium access is granted manually. Public provider URLs can still be accessed outside this website. Protected media requires provider-side access controls.

Render configuration is in `render.yaml`. Set `DATABASE_URL` to a Neon PostgreSQL connection string (a pooled URL is recommended), `APP_URL` to the public origin, and `ADMIN_INITIAL_PASSWORD` to a strong password of at least 12 characters. Keep credentials in Render environment variables, never in Git. Build with `npm ci --include=dev && npm run build`; start with `npm run db:migrate && npm start`. Next.js binds to `0.0.0.0` and uses Render's `PORT`. `/healthz` checks database connectivity.

`npm run db:migrate` creates the PostgreSQL tables and seeds the administrator once. Subsequent runs preserve the stored password and data. Changing `ADMIN_INITIAL_PASSWORD` does not reset an existing administrator password. The older SQLite migration files are retained as history and are not applied to Neon. Existing Cloudflare D1 data is not copied automatically.

For local development, configure the same environment variables in an ignored `.env.local` and use `npm run dev`. The migration script reads process environment variables (or use `node --env-file=.env.local scripts/init-db.mjs`). Check passwords and safe redirects with `npm run test:auth`.

The compiled Flutter frontend is committed in `public/watch`. To update it, run `flutter build web --base-href /watch/` from `flutter_app` and copy `flutter_app/build/web` into `public/watch`. The old sign-in URL remains as a redirect to `/login` for compatibility with the compiled frontend. Legacy Sites tooling is retained in the repository but is not used by the Render build or runtime.
