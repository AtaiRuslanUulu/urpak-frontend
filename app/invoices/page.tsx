"use client";

import { useCallback, useEffect, useState } from "react";

import AgentOnly from "@/components/AgentOnly";
import { ApiError, api, formatPrice } from "@/lib/api";
import type { Deal, Dictionaries } from "@/lib/types";

const EMPTY = {
  client_name: "",
  listing: "",
  curator: "",
  deal_date: new Date().toISOString().slice(0, 10),
  amount: "",
  commission: "",
  currency: "USD",
  note: "",
};

function Invoices() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dictionaries, setDictionaries] = useState<Dictionaries | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .deals()
      .then((data) => setDeals(data.results))
      .catch(() => setError("Не удалось загрузить счета"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    api.dictionaries().then(setDictionaries).catch(() => setDictionaries(null));
  }, [load]);

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const payload: Record<string, unknown> = {
      client_name: form.client_name,
      deal_date: form.deal_date,
      amount: form.amount,
      commission: form.commission,
      currency: form.currency,
      note: form.note,
    };
    if (form.listing) payload.listing = Number(form.listing);
    if (form.curator) payload.curator = Number(form.curator);

    try {
      await api.createDeal(payload);
      setForm({ ...EMPTY });
      setShowForm(false);
      load();
    } catch (err) {
      setErrors(err instanceof ApiError ? err.fieldErrors() : { detail: "Ошибка сохранения" });
    }
  };

  const togglePaid = async (deal: Deal) => {
    await api.updateDeal(deal.id, { is_paid: !deal.is_paid });
    load();
  };

  const remove = async (deal: Deal) => {
    if (!window.confirm(`Удалить счёт по клиенту «${deal.client_name}»?`)) return;
    await api.deleteDeal(deal.id);
    load();
  };

  const unpaid = deals.filter((d) => !d.is_paid);

  const field = (name: keyof typeof EMPTY, label: string, type = "text") => (
    <div>
      <label className="mb-1 block text-sm text-muted">{label}</label>
      <input
        type={type}
        className="input"
        value={form[name]}
        onChange={(e) => set(name, e.target.value)}
      />
      {errors[name] && <p className="mt-1 text-xs text-primary">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Счета</h1>
            <p className="mt-1 text-sm text-muted">
              Комиссии по сделкам. Не оплачено: {unpaid.length} из {deals.length}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Отмена" : "Добавить"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="card mb-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {field("client_name", "Клиент")}
              {field("deal_date", "Дата сделки", "date")}
              {field("amount", "Сумма сделки", "number")}
              {field("commission", "Комиссия", "number")}
              <div>
                <label className="mb-1 block text-sm text-muted">Валюта</label>
                <select
                  className="select"
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                >
                  {(dictionaries?.currencies ?? []).map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted">Куратор</label>
                <select
                  className="select"
                  value={form.curator}
                  onChange={(e) => set("curator", e.target.value)}
                >
                  <option value="">Не указан</option>
                  {(dictionaries?.agents ?? []).map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.full_name}
                    </option>
                  ))}
                </select>
              </div>
              {field("listing", "ID объекта", "number")}
              {field("note", "Примечание")}
            </div>

            {errors.detail && <p className="mt-3 text-sm text-primary">{errors.detail}</p>}

            <button className="btn btn-primary mt-4">Сохранить счёт</button>
          </form>
        )}

        {error ? (
          <div className="py-16 text-center">
            <h3 className="text-lg font-semibold">{error}</h3>
            <button onClick={load} className="btn btn-primary mt-4">
              Попробовать снова
            </button>
          </div>
        ) : loading ? (
          <p className="py-16 text-center text-sm text-muted">Загрузка…</p>
        ) : deals.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">Счетов пока нет.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted">
                <tr>
                  <th className="p-3">Дата</th>
                  <th className="p-3">Клиент</th>
                  <th className="p-3">Объект</th>
                  <th className="p-3">Куратор</th>
                  <th className="p-3">Сделка</th>
                  <th className="p-3">Комиссия</th>
                  <th className="p-3">Оплата</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal.id} className="border-b border-border last:border-0">
                    <td className="p-3">{deal.deal_date}</td>
                    <td className="p-3">{deal.client_name}</td>
                    <td className="p-3 text-muted">
                      {deal.listing ? `ID:${deal.listing}` : "—"}
                    </td>
                    <td className="p-3">{deal.curator_name || "—"}</td>
                    <td className="p-3">{formatPrice(deal.amount, deal.currency)}</td>
                    <td className="p-3 font-medium">
                      {formatPrice(deal.commission, deal.currency)}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => togglePaid(deal)}
                        className={deal.is_paid ? "btn btn-primary px-3 py-1.5" : "btn btn-secondary px-3 py-1.5"}
                      >
                        {deal.is_paid ? "Оплачен" : "Не оплачен"}
                      </button>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => remove(deal)}
                        className="btn btn-secondary px-3 py-1.5"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <AgentOnly>
      <Invoices />
    </AgentOnly>
  );
}
