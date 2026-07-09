'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter, Link } from '@/i18n/navigation';
import { Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { startNavLoading } from '@/lib/navLoading';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const isValid = name && email && password.length >= 6 && passwordsMatch;

  async function submit() {
    if (!passwordsMatch) {
      setError(t('passwordsMismatch'));
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) return setError(error.message);
    startNavLoading();
    router.push('/cabinet');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md py-4 md:py-16">
      <h1 className="font-display text-2xl font-bold">{t('registerTitle')}</h1>
      <p className="mt-1 text-sm text-mut">{t('registerSubtitle')}</p>
      <div className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-6 shadow-card">
        <div>
          <label className="label">{t('nameLabel')}</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} />
        </div>
        <div>
          <label className="label">{t('emailLabel')}</label>
          <input className="input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('emailPlaceholder')} />
        </div>
        <div>
          <label className="label">{t('passwordLabel')}</label>
          <div className="relative">
            <input
              className="input pr-10"
              required
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordMin')}
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
        <div>
          <label className="label">{t('confirmPassword')}</label>
          <div className="relative">
            <input
              className={`input pr-10 ${password && confirmPassword && !passwordsMatch ? 'border-red-500' : ''}`}
              required
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('repeatPassword')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {password && confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-sm text-red-600">{t('passwordsMismatch')}</p>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full text-center" disabled={loading || !isValid} onClick={submit}>
          {loading ? t('creating') : t('createAccount')}
        </button>
        <p className="text-center text-sm text-mut">
          {t('haveAccount')} <Link href="/auth/login" className="font-semibold text-route">{t('loginLink')}</Link>
        </p>
      </div>
      {loading && <LoadingSpinner />}
    </div>
  );
}
