'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.user) {
      setLoading(false);
      setError('Неверный email или пароль');
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.user.id).single();
    if (!profile?.is_admin) {
      await supabase.auth.signOut();
      setLoading(false);
      setError('У этого аккаунта нет доступа к админке');
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-card">
        <h1 className="font-display text-xl font-bold">Вход в админку</h1>
        <div className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
          <div>
            <label className="label">Пароль</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full text-center" disabled={loading || !email || !password} onClick={submit}>
            {loading ? 'Входим…' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}
