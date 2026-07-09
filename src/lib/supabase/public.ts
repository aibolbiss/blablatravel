import { createClient } from '@supabase/supabase-js';

// Для чтения публичных данных (без сессии пользователя) на страницах,
// которые должны кэшироваться (ISR) — не трогает cookies(), в отличие от
// createServerClient из '@/lib/supabase/server', и поэтому не форсит dynamic rendering.
// revalidateSeconds, если передан, кладёт ответ Supabase в Data Cache Next.js —
// повторные запросы с тем же URL отдаются из кэша вместо похода в Supabase.
export function createPublicClient(revalidateSeconds?: number) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    revalidateSeconds != null
      ? {
          global: {
            fetch: (input, init) =>
              fetch(input, { ...init, next: { revalidate: revalidateSeconds } }),
          },
        }
      : undefined
  );
}
