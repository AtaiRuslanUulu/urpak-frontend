// app/submit/apartment/page.tsx
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Spinner from '@/components/Spinner';

type Dev = { id: number; name: string };
type Proj = { id: number; name: string; developer?: Dev };

function apiBase() {
  const base =
    (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '') ||
    'http://127.0.0.1:8000';
  return base;
}

// API отдаёт либо массив, либо { count, next, previous, results }
function asList<T>(data: unknown): T[] {
  return Array.isArray(data) ? data : ((data as { results?: T[] } | null)?.results ?? []);
}

function SubmitApartmentForm() {
  const sp = useSearchParams();
  const presetDev = sp.get('developer') || '';
  const presetProject = sp.get('project') || '';

  const [developers, setDevelopers] = useState<Dev[]>([]);
  const [projects, setProjects] = useState<Proj[]>([]);
  const [devFilter, setDevFilter] = useState<string>(presetDev);

  const [status, setStatus] = useState<'idle'|'sending'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState<number | null>(presetProject ? Number(presetProject) : null);

  const [form, setForm] = useState({
    project: presetProject,
    rooms: '',
    size_m2: '',
    price: '',
    floor: '',
    status: 'available',
    apartment_number: '',
    company: '', // honeypot
  });

  useEffect(() => {
    fetch(`${apiBase()}/api/developers/`).then(r=>r.json()).then(d=>setDevelopers(asList<Dev>(d))).catch(()=>{});
    fetch(`${apiBase()}/api/projects/`).then(r=>r.json()).then(d=>setProjects(asList<Proj>(d))).catch(()=>{});
  }, []);

  const filteredProjects = useMemo(
    () => devFilter ? projects.filter(p => String(p.developer?.id) === String(devFilter)) : projects,
    [projects, devFilter]
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending'); setMessage('');

    const body = JSON.stringify({
      project: Number(form.project),
      rooms: Number(form.rooms),
      size_m2: Number(form.size_m2),
      price: Number(form.price),
      floor: form.floor ? Number(form.floor) : undefined,
      status: form.status || undefined,
      apartment_number: form.apartment_number || undefined,
      company: form.company, // honeypot
    });

    try {
      const res = await fetch(`${apiBase()}/api/submit/apartment/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus('success');
        setMessage(data.message || 'Квартира добавлена.');
        setCreatedProjectId(Number(form.project) || createdProjectId);

        // сбрасываем, но оставляем выбранный проект/девелопера для набора пачкой
        setForm({
          project: form.project,
          rooms: '',
          size_m2: '',
          price: '',
          floor: '',
          status: 'available',
          apartment_number: '',
          company: '',
        });
      } else {
        setStatus('error'); setMessage('Проверьте поля формы.');
      }
    } catch {
      setStatus('error'); setMessage('Ошибка сети.');
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <h1 className="text-2xl font-semibold mb-6 text-center">Добавить квартиру</h1>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* honeypot */}
        <input type="text" name="company" value={form.company} onChange={onChange} className="hidden" tabIndex={-1} autoComplete="off" />

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Фильтр по застройщику</label>
            <select value={devFilter} onChange={(e)=>setDevFilter(e.target.value)} className="select w-full">
              <option value="">Все застройщики</option>
              {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Проект *</label>
            <select name="project" value={form.project} onChange={onChange} required className="select w-full">
              <option value="">Выберите проект</option>
              {filteredProjects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.developer ? ` — ${p.developer.name}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">Комнат *</label>
            <input type="number" name="rooms" value={form.rooms} onChange={onChange} required className="input w-full"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Площадь, м² *</label>
            <input type="number" step="0.01" name="size_m2" value={form.size_m2} onChange={onChange} required className="input w-full"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Этаж</label>
            <input type="number" name="floor" value={form.floor} onChange={onChange} className="input w-full"/>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Цена (USD) *</label>
            <input type="number" name="price" value={form.price} onChange={onChange} required className="input w-full"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Статус</label>
            <select name="status" value={form.status} onChange={onChange} className="select w-full">
              <option value="available">Доступна</option>
              <option value="reserved">Забронирована</option>
              <option value="sold">Продана</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">№ квартиры</label>
          <input name="apartment_number" value={form.apartment_number} onChange={onChange} className="input w-full"/>
        </div>

        <button type="submit" disabled={status==='sending'} className="btn-primary w-full">
          {status==='sending' ? 'Отправка…' : 'Добавить квартиру'}
        </button>
      </form>

      {message && <p className={`mt-4 text-center ${status==='success'?'text-green-600':'text-red-500'}`}>{message}</p>}

      {status==='success' && createdProjectId && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Link href={`/submit/apartment?project=${createdProjectId}&developer=${devFilter || presetDev}`} className="btn-secondary text-center">
            ➕ Добавить ещё квартиру в этот объект
          </Link>
          <Link href={`/submit/project?developer=${devFilter || presetDev}`} className="btn-secondary text-center">
            🏗️ Добавить другой объект
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SubmitApartmentPage() {
  return (
    <Suspense fallback={<div className="container py-16"><Spinner /></div>}>
      <SubmitApartmentForm />
    </Suspense>
  );
}
