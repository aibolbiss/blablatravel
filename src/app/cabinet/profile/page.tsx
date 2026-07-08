'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { uploadPhoto } from '@/lib/upload';
import MapView from '@/components/MapViewDynamic';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Profile } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
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

  if (!p) return <div className="py-20 text-center text-mut">Загрузка профиля…</div>;

  const set = (patch: Partial<Profile>) => setP({ ...p, ...patch });

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !p) return;
    try {
      const url = await uploadPhoto(file, p.id);
      set({ avatar_url: url });
    } catch { setMsg('Не удалось загрузить фото'); }
  }

  async function save() {
    if (!p) return;
    setSaving(true); setMsg('');
    const { error } = await supabase.from('profiles').update({
      name: p.name, gender: p.gender, country: p.country, city: p.city,
      bio: p.bio, avatar_url: p.avatar_url,
    }).eq('id', p.id);
    setSaving(false);
    setMsg(error ? 'Ошибка сохранения' : 'Сохранено ✓');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl py-4 md:py-10">
      <h1 className="font-display text-2xl font-bold">Мой профиль</h1>
      <p className="mt-1 text-sm text-mut">Расскажите о себе — как на странице в соцсети.</p>

      <div className="mt-6 space-y-5 rounded-2xl border border-line bg-white p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-route-light">
            {p.avatar_url ? (
              <Image src={p.avatar_url} alt="" fill sizes="80px" className="object-cover" />
            ) : <div className="flex h-full items-center justify-center text-3xl">🙂</div>}
          </div>
          <label className="btn-ghost cursor-pointer">
            Загрузить фото
            <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Имя</label>
            <input className="input" value={p.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div>
            <label className="label">Пол</label>
            <select className="input" value={p.gender} onChange={(e) => set({ gender: e.target.value as Profile['gender'] })}>
              <option value="male">Мужчина</option>
              <option value="female">Женщина</option>
              <option value="other">Не указывать</option>
            </select>
          </div>
          <div>
            <label className="label">Страна</label>
            <input className="input" value={p.country} onChange={(e) => set({ country: e.target.value })} placeholder="Казахстан" />
          </div>
          <div>
            <label className="label">Город</label>
            <input className="input" value={p.city} onChange={(e) => set({ city: e.target.value })} placeholder="Алматы" />
          </div>
        </div>

        <div>
          <label className="label">О себе</label>
          <textarea className="input min-h-32" value={p.bio}
            onChange={(e) => set({ bio: e.target.value })}
            placeholder="Интересы, стиль путешествий, языки…" />
        </div>

        <div className="flex items-center gap-4">
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Сохраняем…' : 'Сохранить профиль'}
          </button>
          {msg && <span className="text-sm text-mut">{msg}</span>}
        </div>
      </div>
      {saving && <LoadingSpinner />}
    </div>
  );
}
