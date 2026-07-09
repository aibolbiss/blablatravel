import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Клиент с сервисным ключом — обходит RLS и умеет удалять сами аккаунты
// (auth.users), а не только строки в public-таблицах. Использовать ТОЛЬКО
// в серверном коде (Server Actions/Route Handlers) после проверки, что
// текущий пользователь — админ. Никогда не импортировать в клиентские файлы.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY не задан в .env.local — без него нельзя удалять пользователей. См. .env.local.example.'
    );
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Email хранится в auth.users, а не в public.profiles, и недоступен через
// обычный ключ. Если сервисный ключ ещё не настроен — тихо возвращаем
// пустую карту, чтобы админка не падала целиком из-за одной колонки.
export async function getUserEmailMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const admin = createAdminClient();
    let page = 1;
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data) break;
      for (const u of data.users) {
        if (u.email) map.set(u.id, u.email);
      }
      if (data.users.length < 1000) break;
      page += 1;
    }
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY не настроен — покажем таблицы без email
  }
  return map;
}
