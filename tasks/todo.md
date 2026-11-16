# Remove participant sign-in

- [x] Replace participant email authentication with a server-issued browser cookie.
- [x] Keep results and deletion restricted to signed-in admins.
- [x] Update survey copy and setup documentation.
- [x] Verify anonymous submission, duplicate protection, and admin authorization.

## Review

Responses remain in Supabase. Browser cookies cannot enforce one response per person across devices.

Verification: automated tests, TypeScript checks, and production build passed. Live collection still requires real Supabase environment settings.
