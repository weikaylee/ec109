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

## Deployed storage diagnostics

- Session failures now identify missing schema, denied database access, and connection failures with fixed diagnostic codes.
- Safe diagnostic categories are logged for Vercel troubleshooting; raw errors and keys are not returned or logged.
- Added deployment repair instructions and regression tests for each failure category.

## Direct results access

- Results, exports, and confirmed deletion are available at `/results` without authentication.
- Removed survey footer navigation to results and dashboard sign-in controls.
- Retained same-origin checks for deletion and private database permissions.
