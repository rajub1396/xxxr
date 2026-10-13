# RedX 18+ Video

Flutter Web frontend with a Vinext/Cloudflare D1 API. The site is public. An 18+ confirmation screen appears before the library and remembers confirmation for the current browser tab session. This is self-declared age confirmation, not identity or age verification.

Admin entry: `/admin-login`. The protected `/admin` dashboard supports publishing and deleting videos, searching the collection, and granting or revoking premium membership. Sign in with ChatGPT as `rajuit1396@gmail.com`. Other accounts are redirected to the login page; API operations also enforce administrator authorization. These routes use the existing Sites authentication and Cloudflare D1 backend, which still require adaptation for Render.

Admin: rajuit1396@gmail.com. Sign in through ChatGPT with that email to open Admin Studio. Publish HTTPS embed links or paste iframe code, remove videos, and grant or revoke premium access. Only the iframe src URL is retained; supplied HTML is never rendered. YouTube and Vimeo share links are normalized automatically. Other providers require their player/embed URL and must permit iframe playback. Players run in a sandbox without top navigation or popups.

New videos appear immediately after publishing; other open browsers refresh every 30 seconds. Premium embed URLs are returned only after server authorization. No payment processor is configured: premium access is granted manually. Public provider URLs can still be accessed outside this website. Protected media requires provider-side access controls.

Build frontend: run Flutter build web with --base-href /watch/, then copy flutter_app/build/web into public/watch. Run npm run db:generate after schema changes and the Sites build helper to build the server. On this Windows machine, use the local npm shim in .sites-runtime/bin, Git Bash in PATH, and TAR_OPTIONS=--force-local for Sites packaging.
