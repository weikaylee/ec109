import 'server-only';
import {randomUUID} from 'node:crypto';
import {cookies} from 'next/headers';

const cookieName = 'cds-participant';

/** Resolve an anonymous browser identity; only session initialization may create it. */
export async function participantKey(create = false): Promise<string | null> {
  const jar = await cookies();
  const existing = jar.get(cookieName)?.value;
  if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return 'anonymous:' + existing;
  if (!create) return null;
  const id = randomUUID();
  jar.set(cookieName, id, {httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365});
  return 'anonymous:' + id;
}
