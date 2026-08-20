"use client";

import { useCallback, useEffect, useState } from "react";

import ManagerOnly from "@/components/ManagerOnly";
import SettingsTabs from "@/components/SettingsTabs";
import { ApiError, api } from "@/lib/api";
import type { AgentRow } from "@/lib/types";

const EMPTY = {
  username: "",
  password: "",
  full_name: "",
  phone: "",
  whatsapp: "",
  telegram: "",
  is_manager: false,
  is_active: true,
};

type FormState = typeof EMPTY;

function Agents() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [editing, setEditing] = useState<AgentRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .agents()
      .then(setAgents)
      .catch(() => setError("Не удалось загрузить агентов"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const startCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setErrors({});
    setShowForm(true);
  };

  const startEdit = (agent: AgentRow) => {
    setEditing(agent);
    setForm({
      username: agent.username,
      password: "",
      full_name: agent.full_name,
      phone: agent.phone ?? "",
      whatsapp: agent.whatsapp ?? "",
      telegram: agent.telegram ?? "",
      is_manager: agent.is_manager,
      is_active: agent.is_active,
    });
    setErrors({});
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload: Record<string, unknown> = { ...form };
    // Пустой пароль на правке означает «оставить прежний».
    if (editing && !form.password) delete payload.password;

    try {
      if (editing) await api.updateAgent(editing.id, payload);
      else await api.createAgent(payload);
      setShowForm(false);
      setForm({ ...EMPTY });
      setEditing(null);
      load();
    } catch (err) {
      setErrors(
        err instanceof ApiError ? err.fieldErrors() : { detail: "Ошибка сохранения" }
      );
    }
  };

  const toggleActive = async (agent: AgentRow) => {
    if (agent.is_active) {
      const message =
        agent.listings_count > 0
          ? `Отключить агента «${agent.full_name}»? Он не сможет войти, но его ${agent.listings_count} объект(ов) и история останутся.`
          : `Отключить агента «${agent.full_name}»? Он не сможет войти.`;
      if (!window.confirm(message)) return;
      await api.deactivateAgent(agent.id);
    } else {
      await api.updateAgent(agent.id, { is_active: true });
    }
    load();
  };

  const field = (
    name: keyof FormState,
    label: string,
    type = "text",
    hint?: string
  ) => (
    <div>
      <label className="mb-1 block text-sm text-muted">{label}</label>
      <input
        type={type}
        className="input"
        value={String(form[name] ?? "")}
        onChange={(e) => set(name, e.target.value)}
        autoComplete="off"
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {errors[name] && <p className="mt-1 text-xs text-primary">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-semibold">Настройки</h1>
        <SettingsTabs />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Агентов: {agents.filter((a) => a.is_active).length} активных из {agents.length}
          </p>
          <button className="btn btn-primary" onClick={startCreate}>
            Добавить агента
          </button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="card mb-6">
            <h2 className="mb-3 text-sm font-semibold">
              {editing ? `Правка: ${editing.full_name}` : "Новый агент"}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {field("full_name", "ФИО")}
              {field("username", "Логин для входа")}
              {field(
                "password",
                editing ? "Новый пароль" : "Пароль",
                "password",
                editing ? "Оставьте пустым, чтобы не менять" : "Минимум 8 символов"
              )}
              {field("phone", "Телефон")}
              {field("whatsapp", "WhatsApp", "text", "Только цифры, иначе возьмём телефон")}
              {field("telegram", "Telegram", "text", "Ник без @")}
            </div>

            <div className="mt-4 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.is_manager}
                  onChange={(e) => set("is_manager", e.target.checked)}
                />
                Руководитель
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.is_active}
                  onChange={(e) => set("is_active", e.target.checked)}
                />
                Работает
              </label>
            </div>
            <p className="mt-2 text-xs text-muted">
              Руководитель может заводить агентов и править справочники.
            </p>

            {errors.detail && <p className="mt-3 text-sm text-primary">{errors.detail}</p>}

            <div className="mt-4 flex gap-3">
              <button className="btn btn-primary">Сохранить</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Отмена
              </button>
            </div>
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
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted">
                <tr>
                  <th className="p-3">ФИО</th>
                  <th className="p-3">Логин</th>
                  <th className="p-3">Телефон</th>
                  <th className="p-3">Роль</th>
                  <th className="p-3">Объектов</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className={`border-b border-border last:border-0 ${
                      agent.is_active ? "" : "text-muted"
                    }`}
                  >
                    <td className="p-3">{agent.full_name}</td>
                    <td className="p-3 text-muted">{agent.username}</td>
                    <td className="p-3">{agent.phone || "—"}</td>
                    <td className="p-3">{agent.is_manager ? "Руководитель" : "Агент"}</td>
                    <td className="p-3">{agent.listings_count}</td>
                    <td className="p-3">{agent.is_active ? "Работает" : "Отключён"}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn btn-secondary px-3 py-1.5"
                          onClick={() => startEdit(agent)}
                        >
                          Изменить
                        </button>
                        <button
                          className="btn btn-secondary px-3 py-1.5"
                          onClick={() => toggleActive(agent)}
                        >
                          {agent.is_active ? "Отключить" : "Вернуть"}
                        </button>
                      </div>
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

export default function AgentsSettingsPage() {
  return (
    <ManagerOnly>
      <Agents />
    </ManagerOnly>
  );
}
