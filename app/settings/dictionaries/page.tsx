"use client";

import { useCallback, useEffect, useState } from "react";

import ManagerOnly from "@/components/ManagerOnly";
import SettingsTabs from "@/components/SettingsTabs";
import { ApiError, api } from "@/lib/api";
import { DICTIONARY_LABELS } from "@/lib/dictionaries";
import type { DictionaryEntry, DictionaryKind } from "@/lib/types";

function Dictionaries() {
  const [kind, setKind] = useState<DictionaryKind>("districts");
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .dictionaryEntries(kind)
      .then(setEntries)
      .catch(() => setError("Не удалось загрузить справочник"))
      .finally(() => setLoading(false));
  }, [kind]);

  useEffect(load, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    setNotice(null);
    try {
      await api.createDictionaryEntry(kind, name);
      setNewName("");
      load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.fieldErrors().name || "Не удалось добавить"
          : "Не удалось добавить"
      );
    }
  };

  const rename = async (entry: DictionaryEntry) => {
    const name = editingName.trim();
    if (!name || name === entry.name) {
      setEditingId(null);
      return;
    }
    setError(null);
    try {
      await api.updateDictionaryEntry(kind, entry.id, { name });
      setEditingId(null);
      load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.fieldErrors().name || "Не удалось переименовать"
          : "Не удалось переименовать"
      );
    }
  };

  const toggle = async (entry: DictionaryEntry) => {
    await api.updateDictionaryEntry(kind, entry.id, { is_active: !entry.is_active });
    load();
  };

  const remove = async (entry: DictionaryEntry) => {
    if (!window.confirm(`Удалить «${entry.name}»?`)) return;
    setNotice(null);
    const result = await api.deleteDictionaryEntry(kind, entry.id);
    // Занятое значение сервер прячет вместо удаления и объясняет почему.
    if (result && "detail" in result && result.detail) setNotice(result.detail);
    load();
  };

  const currentLabel = DICTIONARY_LABELS.find((d) => d.kind === kind)?.label ?? "";

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-semibold">Настройки</h1>
        <SettingsTabs />

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <nav className="flex flex-wrap gap-2 lg:flex-col">
            {DICTIONARY_LABELS.map((item) => (
              <button
                key={item.kind}
                onClick={() => {
                  setKind(item.kind);
                  setEditingId(null);
                  setNotice(null);
                }}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                  item.kind === kind
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted hover:text-fg"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div>
            <div className="card mb-4">
              <h2 className="mb-3 text-sm font-semibold">{currentLabel}</h2>
              <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="input"
                  placeholder="Новое значение"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button className="btn btn-primary sm:w-40">Добавить</button>
              </form>
              {error && <p className="mt-2 text-sm text-primary">{error}</p>}
              {notice && <p className="mt-2 text-sm text-muted">{notice}</p>}
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-muted">Загрузка…</p>
            ) : entries.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">
                Справочник пуст — добавьте первое значение.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center gap-3 border-b border-border p-3 last:border-0"
                  >
                    {editingId === entry.id ? (
                      <input
                        className="input flex-1"
                        value={editingName}
                        autoFocus
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") rename(entry);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onBlur={() => rename(entry)}
                      />
                    ) : (
                      <span
                        className={`flex-1 text-sm ${entry.is_active ? "" : "text-muted line-through"}`}
                      >
                        {entry.name}
                      </span>
                    )}

                    <button
                      className="btn btn-secondary px-3 py-1.5"
                      onClick={() => {
                        setEditingId(entry.id);
                        setEditingName(entry.name);
                      }}
                    >
                      Переименовать
                    </button>
                    <button
                      className="btn btn-secondary px-3 py-1.5"
                      onClick={() => toggle(entry)}
                    >
                      {entry.is_active ? "Скрыть" : "Показать"}
                    </button>
                    <button
                      className="btn btn-secondary px-3 py-1.5"
                      onClick={() => remove(entry)}
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-3 text-xs text-muted">
              Скрытое значение исчезает из фильтров и форм, но объекты, где оно уже
              стоит, его сохраняют. Значение, которое используется, при удалении будет
              скрыто, а не стёрто.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DictionariesSettingsPage() {
  return (
    <ManagerOnly>
      <Dictionaries />
    </ManagerOnly>
  );
}
