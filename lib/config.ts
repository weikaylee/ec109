/** Check required session settings without exposing credential values to clients. */
export function sessionConfigurationReady(env: NodeJS.ProcessEnv = process.env): boolean {
  const keys = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  if (keys.some(key => !env[key]?.trim() || env[key]!.includes('YOUR_'))) return false;
  try {
    const url = new URL(env.SUPABASE_URL!);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
  } catch {
    return false;
  }
  return true;
}
