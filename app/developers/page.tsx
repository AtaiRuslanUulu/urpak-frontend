"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

interface Developer {
  id: number;
  name: string;
  description: string;
  website?: string;
  logo_url: string;
  created_at?: string;
  projects?: Array<{ id: number; name: string; city: string }>;
}

type SortDirection = "asc" | "desc";
type SortField = "name" | "projects" | "newest";

export default function Developers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";
  const API_URL = `${API_BASE}/api/developers/`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const data: Developer[] = Array.isArray(raw) ? raw : raw.results || [];
        if (!cancelled) setDevelopers(data);
      } catch (err) {
        console.error("Ошибка загрузки застройщиков:", err);
        if (!cancelled) setError("Не удалось загрузить застройщиков");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  const processedDevelopers = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = developers.filter(
      (d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
    );
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "projects":
          cmp = (a.projects?.length || 0) - (b.projects?.length || 0);
          break;
        case "newest":
          cmp =
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime();
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return filtered;
  }, [developers, search, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const clearSearch = () => setSearch("");

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">{error}</h1>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-2xl font-semibold mb-1">Застройщики Кыргызстана</h1>
        <p className="text-sm text-muted">
          {loading
            ? "Загрузка…"
            : `${processedDevelopers.length} из ${developers.length} застройщиков`}
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск застройщиков…"
              className="input pl-10"
              aria-label="Поиск застройщиков"
            />
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-4.2-4.2M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
              />
            </svg>
          </div>

          <div className="flex gap-2">
            {(["name", "projects", "newest"] as SortField[]).map((field) => (
              <button
                key={field}
                onClick={() => handleSort(field)}
                className={sortField === field ? "btn-primary" : "btn-secondary"}
              >
                {field === "name"
                  ? "Название"
                  : field === "projects"
                  ? "Проекты"
                  : "Новые"}{" "}
                {sortField === field ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </button>
            ))}
          </div>

          {search && (
            <button onClick={clearSearch} className="btn-secondary">
              Очистить
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-64">
              <div className="mx-auto h-20 w-20 rounded-full bg-accent mb-3" />
              <div className="mx-auto h-4 w-1/2 rounded bg-accent mb-2" />
              <div className="mx-auto h-3 w-2/3 rounded bg-accent" />
            </div>
          ))}
        </div>
      ) : processedDevelopers.length === 0 ? (
        <div className="mx-auto max-w-md py-16 text-center">
          <h3 className="text-lg font-semibold">Застройщики не найдены</h3>
          <p className="text-sm text-muted mt-1">Попробуйте изменить запрос.</p>
          {search && (
            <button onClick={clearSearch} className="btn-primary mt-4">
              Очистить поиск
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
          {processedDevelopers.map((dev) => (
            <Link
              key={dev.id}
              href={`/developers/${dev.id}`}
              className="card group block w-full max-w-sm p-6 text-center transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              aria-label={`Застройщик ${dev.name}`}
            >
              {dev.logo_url ? (
                <Image
                  src={dev.logo_url}
                  alt={dev.name}
                  width={80}
                  height={80}
                  className="mx-auto mb-4 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent text-lg font-semibold text-muted">
                  {dev.name.charAt(0)}
                </div>
              )}

              <h2 className="text-base font-semibold mb-2">{dev.name}</h2>
              <p className="text-sm text-muted mb-3 line-clamp-3">{dev.description}</p>

              <div className="flex flex-wrap justify-center gap-2 text-xs">
                {!!dev.projects?.length && (
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-700">
                    {dev.projects.length} проектов
                  </span>
                )}
                {dev.website && (
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                    Сайт
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
