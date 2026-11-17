/** Convert database failures to fixed diagnostics without returning raw server errors. */
export function storageDiagnostic(error: unknown): {code: string; error: string} {
  const value = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const code = typeof value.code === 'string' ? value.code : '';
  if (['PGRST202', 'PGRST205', '42883', '42P01', '42703'].includes(code)) {
    return {code: 'STORAGE_SCHEMA', error: 'Survey database setup is incomplete. The site owner must run supabase/schema.sql in the Supabase SQL editor for the project used by this deployment.'};
  }
  if (['42501', 'PGRST301', 'PGRST302', 'PGRST303'].includes(code) || /invalid api key/i.test(String(value.message))) {
    return {code: 'STORAGE_ACCESS', error: 'Survey database access failed. The site owner must check the Supabase service-role key and database permissions, then redeploy.'};
  }
  if (code.startsWith('PGRST00') || /fetch failed|network|timeout/i.test(String(value.message))) {
    return {code: 'STORAGE_CONNECTION', error: 'The survey database is unreachable. Please retry shortly. The site owner should check the Supabase project status and configured URL.'};
  }
  return {code: 'STORAGE_UNAVAILABLE', error: 'Could not load your survey. The site owner should check the Vercel runtime logs for the session failure code.'};
}
