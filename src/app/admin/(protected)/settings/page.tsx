'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [currentEmail, setCurrentEmail] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data.user?.email ?? '');
      setEmail(data.user?.email ?? '');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setError(''); setMsg('');
    if (password && password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (password && password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }

    const payload: { email?: string; password?: string } = {};
    if (email && email !== currentEmail) payload.email = email;
    if (password) payload.password = password;

    if (!payload.email && !payload.password) {
      setError('Нечего сохранять — измените email или укажите новый пароль');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser(payload);
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword('');
    setConfirmPassword('');
    setMsg(
      payload.email
        ? 'Сохранено. На новый email придёт письмо для подтверждения — логин изменится после перехода по ссылке.'
        : 'Пароль обновлён.'
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold">Настройки админки</h1>
      <p className="mt-1 text-sm text-mut">Смена логина (email) и пароля от этого админ-аккаунта.</p>

      <div className="mt-6 space-y-4 rounded-2xl border border-line bg-white p-6 shadow-card">
        <div>
          <label className="label">Email (логин)</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Новый пароль</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Оставьте пустым, если не меняете" />
        </div>
        <div>
          <label className="label">Повторите новый пароль</label>
          <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-route">{msg}</p>}
        <button className="btn-primary w-full text-center" disabled={saving} onClick={save}>
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
