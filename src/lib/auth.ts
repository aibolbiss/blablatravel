import { headers } from 'next/headers';

// middleware.ts already validates the session and forwards the user id via
// this header, so server components/pages don't need a second auth.getUser() call.
export function getUserId(): string | null {
  return headers().get('x-user-id') || null;
}
