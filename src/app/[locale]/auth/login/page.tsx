'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter, Link } from '@/i18n/navigation';
import { Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { startNavLoading } from '@/lib/navLoading';

export default function LoginPage() {
  const t = useTranslations('auth');
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
    if (error) return setError(t('wrongCreds'));
    startNavLoading();
    router.push('/cabinet');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md py-4 md:py-16">
      <h1 className="font-display text-2xl font-bold">{t('loginTitle')}</h1>
      <p className="mt-1 text-sm text-mut">{t('loginSubtitle')}</p>
      <div className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-6 shadow-card">
        <div>
          <label className="label">{t('email')}</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('emailPlaceholder')} />
        </div>
        <div>
          <label className="label">{t('password')}</label>
          <div className="relative">
            <input
              className="input pr-10"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={t('enterPassword')}
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
          {loading ? t('loggingIn') : t('loginBtn')}
        </button>
        <p className="text-center text-sm text-mut">
          {t('noAccount')} <Link href="/auth/register" className="font-semibold text-route">{t('registerLink')}</Link>
        </p>
      </div>
      {loading && <LoadingSpinner />}
    </div>
  );
}
