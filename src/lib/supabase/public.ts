import { createClient } from '@supabase/supabase-js';

// Для чтения публичных данных (без сессии пользователя) на страницах,
// которые должны кэшироваться (ISR) — не трогает cookies(), в отличие от
// createServerClient из '@/lib/supabase/server', и поэтому не форсит dynamic rendering.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
