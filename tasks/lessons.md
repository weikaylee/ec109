# Lessons

- A generic session error does not establish that configuration is missing. Preserve safe diagnostic categories and test database error paths so deployment failures can be distinguished.
- Local mocked tests and successful builds do not verify production database provisioning. Report that boundary explicitly.

- When removing dashboard filters, remove derived filtered data as well; type checking catches stale state references.
