# RedX Video

Flutter Web frontend with a Vinext/Cloudflare D1 API. Authentication uses Sites ChatGPT sign-in. Admin: rajuit1396@gmail.com. No password is stored in source. Sign in with that email to open Admin Studio, publish YouTube/Vimeo URLs, remove videos, and grant or revoke premium membership. New videos appear immediately after publishing and other open browsers refresh every 30 seconds. Premium URLs are returned only after server authorization.

No payment processor is configured: premium access is granted manually. Provider embeds must allow playback; publicly shared provider URLs cannot be protected by this website. For paid content, use a provider with domain restrictions or signed playback URLs.

Build frontend: run Flutter build web with --base-href /watch/, then copy flutter_app/build/web into public/watch. Run npm run db:generate after schema changes and the Sites build helper to build the server. Hosting starts owner-private; visitor access requires an explicit audience change in Sites. The admin account must also be allowed by the hosting audience.
