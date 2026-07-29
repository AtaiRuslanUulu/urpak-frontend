// app/submit/developer/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

function apiBase() {
  const base =
    (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '') ||
    'http://127.0.0.1:8000';
  return base;
}

export default function SubmitDeveloperPage() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    website: '',
    logo_url: '',
    contact_phone: '',
    company: '', // honeypot
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [developerId, setDeveloperId] = useState<number | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending'); setMessage('');

    try {
      const res = await fetch(`${apiBase()}/api/submit/developer/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus('success');
        setMessage(data.message || 'Заявка отправлена!');
        setDeveloperId(data.developer_id ?? null);
        setForm({ name: '', description: '', website: '', logo_url: '', contact_phone: '', company: '' });
      } else {
        setStatus('error');
        setMessage(data?.errors ? 'Проверьте поля формы.' : 'Ошибка при отправке формы.');
      }
    } catch {
      setStatus('error'); setMessage('Ошибка сети.');
    }
  };

  return (
    <div className="container mx-auto max-w-lg py-10">
      <h1 className="text-2xl font-semibold mb-6 text-center">Добавить застройщика</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* honeypot */}
        <input type="text" name="company" value={form.company} onChange={onChange} className="hidden" tabIndex={-1} autoComplete="off" />

        <div>
          <label className="block text-sm font-medium">Название *</label>
          <input name="name" value={form.name} onChange={onChange} required className="input w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium">Описание</label>
          <textarea name="description" value={form.description} onChange={onChange} rows={4} className="input w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium">Сайт</label>
          <input type="url" name="website" value={form.website} onChange={onChange} placeholder="https://example.com" className="input w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium">Логотип (URL)</label>
          <input type="url" name="logo_url" value={form.logo_url} onChange={onChange} placeholder="https://..." className="input w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium">Телефон / WhatsApp</label>
          <input name="contact_phone" value={form.contact_phone} onChange={onChange} placeholder="+996 555 123 456" className="input w-full" />
        </div>

        <button type="submit" disabled={status==='sending'} className="btn-primary w-full">
          {status === 'sending' ? 'Отправка…' : 'Отправить'}
        </button>
      </form>

      {message && (
        <p className={`mt-4 text-center text-sm ${status==='success' ? 'text-green-600' : 'text-red-500'}`}>{message}</p>
      )}

      {status === 'success' && developerId && (
        <div className="mt-8 flex flex-col gap-3">
          <Link href={`/submit/project?developer=${developerId}`} className="btn-secondary w-full text-center">
            ➕ Добавить объект
          </Link>
        </div>
      )}
    </div>
  );
}
