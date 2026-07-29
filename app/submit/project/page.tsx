// app/submit/project/page.tsx
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Spinner from '@/components/Spinner';

type Dev = { id: number; name: string };
type Img = { url: string; caption?: string; position?: number };

function apiBase() {
  const base =
    (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '') ||
    'http://127.0.0.1:8000';
  return base;
}

function SubmitProjectForm() {
  const sp = useSearchParams();
  const presetDev = sp.get('developer') || '';

  const [devs, setDevs] = useState<Dev[]>([]);
  const [status, setStatus] = useState<'idle'|'sending'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: '',
    developer: presetDev,
    city: '',
    address: '',
    completion_date: '',
    price_per_m2: '',
    main_image_url: '',
    description: '',
    company: '', // honeypot
  });

  const [images, setImages] = useState<Img[]>([{ url: '' }]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    fetch(`${apiBase()}/api/developers/`)
      .then(r => r.json())
      .then((arr: Dev[]) => setDevs(arr))
      .catch(() => setDevs([]));
  }, []);

  useEffect(() => {
    if (presetDev) setForm(f => ({ ...f, developer: presetDev }));
  }, [presetDev]);

  const addImg = () => setImages(prev => [...prev, { url: '' }]);
  const delImg = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i));
  const setImg = (i: number, key: keyof Img, val: string) =>
    setImages(prev => prev.map((row, idx) => (idx === i ? { ...row, [key]: key==='position' ? Number(val) : val } : row)));

  const canSubmit = useMemo(() => form.name && form.developer && form.city && form.completion_date && form.address && form.price_per_m2, [form]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus('sending'); setMessage('');

    const imgs = images.filter(i => i.url?.trim());
    const body = JSON.stringify({
      name: form.name,
      developer: Number(form.developer),
      city: form.city,
      address: form.address,
      completion_date: form.completion_date,
      price_per_m2: form.price_per_m2 ? Number(form.price_per_m2) : undefined,
      main_image_url: form.main_image_url || undefined,
      description: form.description || undefined,
      images: imgs,
      company: form.company, // honeypot
    });

    try {
      const res = await fetch(`${apiBase()}/api/submit/project/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus('success');
        setMessage(data.message || 'Проект отправлен.');
        setCreatedProjectId(data.project_id ?? null);

        // сброс формы, но держим выбранного девелопера для удобства
        const keepDev = form.developer;
        setForm({
          name: '', developer: keepDev, city: '', address: '',
          completion_date: '', price_per_m2: '', main_image_url: '', description: '', company: '',
        });
        setImages([{ url: '' }]);
      } else {
        setStatus('error'); setMessage('Проверьте данные формы.');
      }
    } catch {
      setStatus('error'); setMessage('Ошибка сети.');
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <h1 className="text-2xl font-semibold mb-6 text-center">Добавить объект</h1>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* honeypot */}
        <input type="text" name="company" value={form.company} onChange={onChange} className="hidden" tabIndex={-1} autoComplete="off" />

        <div>
          <label className="block text-sm font-medium">Застройщик *</label>
          <select name="developer" value={form.developer} onChange={onChange} required className="select w-full">
            <option value="">Выберите застройщика</option>
            {devs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Название *</label>
          <input name="name" value={form.name} onChange={onChange} required className="input w-full"/>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Город *</label>
            <input name="city" value={form.city} onChange={onChange} required className="input w-full"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Срок сдачи *</label>
            <input type="date" name="completion_date" value={form.completion_date} onChange={onChange} required className="input w-full"/>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Адрес *</label>
          <input name="address" value={form.address} onChange={onChange} required className="input w-full"/>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Цена за м² (USD) *</label>
            <input type="number" name="price_per_m2" value={form.price_per_m2} onChange={onChange} required className="input w-full"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Главное изображение (URL)</label>
            <input name="main_image_url" value={form.main_image_url} onChange={onChange} placeholder="https://..." className="input w-full"/>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Краткое описание</label>
          <textarea name="description" value={form.description} onChange={onChange} rows={4} className="input w-full"/>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Фотографии (URL)</div>
          {images.map((img, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-12">
              <input
                placeholder="https://..."
                value={img.url || ''}
                onChange={(e) => setImg(i, 'url', e.target.value)}
                className="input md:col-span-7"
              />
              <input
                placeholder="Подпись"
                value={img.caption || ''}
                onChange={(e) => setImg(i, 'caption', e.target.value)}
                className="input md:col-span-4"
              />
              <input
                type="number"
                placeholder="Порядок"
                value={img.position ?? ''}
                onChange={(e) => setImg(i, 'position', e.target.value)}
                className="input md:col-span-1"
              />
              <button type="button" onClick={() => delImg(i)} className="btn-secondary md:col-span-12">Удалить</button>
            </div>
          ))}
          <button type="button" onClick={addImg} className="btn-secondary">+ Добавить фото</button>
        </div>

        <button type="submit" disabled={status==='sending' || !canSubmit} className="btn-primary w-full">
          {status==='sending' ? 'Отправка…' : 'Отправить проект'}
        </button>
      </form>

      {message && <p className={`mt-4 text-center ${status==='success'?'text-green-600':'text-red-500'}`}>{message}</p>}

      {status==='success' && createdProjectId && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Link href={`/submit/project?developer=${form.developer || presetDev}`} className="btn-secondary text-center">
            ➕ Добавить ещё объект
          </Link>
          <Link href={`/submit/apartment?project=${createdProjectId}&developer=${form.developer || presetDev}`} className="btn-secondary text-center">
            🏠 Добавить квартиры в этот объект
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SubmitProjectPage() {
  return (
    <Suspense fallback={<div className="container py-16"><Spinner /></div>}>
      <SubmitProjectForm />
    </Suspense>
  );
}
