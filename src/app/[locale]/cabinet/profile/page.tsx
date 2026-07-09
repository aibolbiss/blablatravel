'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { uploadPhoto } from '@/lib/upload';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Profile } from '@/lib/types';
import { useRouter } from '@/i18n/navigation';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const supabase = createClient();
  const router = useRouter();
  const [p, setP] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setP(data);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!p) return <div className="py-20 text-center text-mut">{t('loading')}</div>;

  const set = (patch: Partial<Profile>) => setP({ ...p, ...patch });

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !p) return;
    try {
      const url = await uploadPhoto(file, p.id);
      set({ avatar_url: url });
    } catch { setMsg(t('uploadError')); }
  }

  async function save() {
    if (!p) return;
    setSaving(true); setMsg('');
    const { error } = await supabase.from('profiles').update({
      name: p.name, gender: p.gender, country: p.country, city: p.city,
      bio: p.bio, avatar_url: p.avatar_url,
    }).eq('id', p.id);
    setSaving(false);
    setMsg(error ? t('saveError') : t('saved'));
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl py-4 md:py-10">
      <h1 className="font-display text-2xl font-bold">{t('title')}</h1>
      <p className="mt-1 text-sm text-mut">{t('subtitle')}</p>

      <div className="mt-6 space-y-5 rounded-2xl border border-line bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-route-light">
            {p.avatar_url ? (
              <Image src={p.avatar_url} alt="" fill sizes="80px" className="object-cover" />
            ) : <div className="flex h-full items-center justify-center text-3xl">🙂</div>}
          </div>
          <label className="btn-ghost cursor-pointer">
            {t('uploadPhoto')}
            <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t('name')}</label>
            <input className="input" value={p.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('gender')}</label>
            <select className="input" value={p.gender} onChange={(e) => set({ gender: e.target.value as Profile['gender'] })}>
              <option value="male">{t('male')}</option>
              <option value="female">{t('female')}</option>
              <option value="other">{t('other')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('country')}</label>
            <input className="input" value={p.country} onChange={(e) => set({ country: e.target.value })} placeholder={t('countryPlaceholder')} />
          </div>
          <div>
            <label className="label">{t('city')}</label>
            <input className="input" value={p.city} onChange={(e) => set({ city: e.target.value })} placeholder={t('cityPlaceholder')} />
          </div>
        </div>

        <div>
          <label className="label">{t('bio')}</label>
          <textarea className="input min-h-32" value={p.bio}
            onChange={(e) => set({ bio: e.target.value })}
            placeholder={t('bioPlaceholder')} />
        </div>

        <div className="flex items-center gap-4">
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </button>
          {msg && <span className="text-sm text-mut">{msg}</span>}
        </div>
      </div>
      {saving && <LoadingSpinner />}
    </div>
  );
}
