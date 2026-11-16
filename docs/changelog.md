# Changelog

## Session setup diagnostics

- Session requests return an actionable setup message when Supabase settings are missing, placeholders, or invalid, or the participant secret is too short.
- The survey displays the server's error instead of hiding it behind a generic reload message.
- Authentication remains required. Configure `.env.local` according to README.md and restart the development server before signing in.

## Anonymous survey participation

- Participants no longer sign in; session initialization sets a random HttpOnly browser cookie.
- Submissions retain transactional duplicate protection per browser in Supabase.
- Admin results and deletion still require email authentication and the admin allowlist.
- Documented shared database storage and the limits of browser-based duplicate prevention.
