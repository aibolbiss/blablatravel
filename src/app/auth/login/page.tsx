'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError('Неверный email или пароль');
    router.push('/cabinet');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md py-4 md:py-16">
      <h1 className="font-display text-2xl font-bold">Вход</h1>
      <p className="mt-1 text-sm text-mut">С возвращением! Куда едем сегодня?</p>
      <div className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-6 shadow-card">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Пароль</label>
          <div className="relative">
            <input 
              className="input pr-10" 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()} 
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full text-center" disabled={loading} onClick={submit}>
          {loading ? 'Входим…' : 'Войти'}
        </button>
        <p className="text-center text-sm text-mut">
          Нет аккаунта? <Link href="/auth/register" className="font-semibold text-route">Регистрация</Link>
        </p>
      </div>
      {loading && <LoadingSpinner />}
    </div>
  );
}
