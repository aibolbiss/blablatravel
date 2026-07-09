'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизован');
  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!me?.is_admin) throw new Error('Доступ запрещён');
  return supabase;
}

// Полное удаление аккаунта (auth.users) — каскадом сносит профиль,
// объявления, избранное, диалоги и сообщения этого пользователя.
// Требует SUPABASE_SERVICE_ROLE_KEY в .env.local (см. lib/supabase/admin.ts).
export async function deleteUserAction(targetUserId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export async function deleteMessageAction(messageId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('messages').delete().eq('id', messageId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/messages');
}

// Удаляет диалог целиком — сообщения удалятся каскадом (FK on delete cascade)
export async function deleteConversationAction(conversationId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/messages');
}
