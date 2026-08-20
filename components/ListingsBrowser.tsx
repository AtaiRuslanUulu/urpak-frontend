"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import FiltersBar, { FilterKey, FilterValues } from "@/components/FiltersBar";
import ListingCard from "@/components/ListingCard";
import Tabs, { TabItem } from "@/components/Tabs";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import type { Dictionaries, Listing } from "@/lib/types";

/** Параметры, которые живут в адресной строке: ссылку с подборкой можно переслать. */
const FILTER_PARAMS = [
  "id", "q", "property_type", "complex", "series", "floor", "condition",
  "rooms", "status", "district", "price_min", "price_max", "area_min",
  "area_max", "curator",
];

interface Props {
  heading: string;
  dealType?: "sale" | "rent";
  fields: FilterKey[];
  tabs: TabItem[];
  source?: "active" | "deleted";
  canAdd?: boolean;
}

export default function ListingsBrowser({
  heading, dealType, fields, tabs, source = "active", canAdd = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [dictionaries, setDictionaries] = useState<Dictionaries | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTab = searchParams.get("tab") || "all";
  const page = Number(searchParams.get("page") || 1);

  const values: FilterValues = useMemo(() => {
    const out: FilterValues = {};
    for (const key of FILTER_PARAMS) out[key] = searchParams.get(key) ?? "";
    return out;
  }, [searchParams]);

  // Вкладка «Мои варианты» бессмысленна без входа.
  const visibleTabs = useMemo(
    () => (user ? tabs : tabs.filter((tab) => tab.key !== "mine")),
    [tabs, user]
  );

  const pushParams = useCallback(
    (next: Record<string, string>) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(next)) {
        if (value) params.set(key, value);
      }
      router.replace(params.toString() ? `${pathname}?${params}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router]
  );

  const applyFilters = (next: FilterValues) =>
    pushParams({ ...next, tab: activeTab === "all" ? "" : activeTab });

  const resetFilters = () => pushParams({ tab: activeTab === "all" ? "" : activeTab });

  const changeTab = (tab: string) =>
    pushParams({ ...values, tab: tab === "all" ? "" : tab });

  const goToPage = (next: number) =>
    pushParams({
      ...values,
      tab: activeTab === "all" ? "" : activeTab,
      page: next > 1 ? String(next) : "",
    });

  useEffect(() => {
    api.dictionaries().then(setDictionaries).catch(() => setDictionaries(null));
  }, []);

  const load = useCallback(() => {
    // «Мои варианты» и корзина ждут, пока определится пользователь.
    if (authLoading) return;

    setLoading(true);
    setError(null);

    const params = {
      ...values,
      deal_type: dealType ?? "",
      tab: activeTab === "all" ? "" : activeTab,
      page: page > 1 ? String(page) : "",
    };

    const request =
      source === "deleted" ? api.deletedListings(params) : api.listings(params);

    request
      .then((data) => {
        setListings(data.results);
        setCount(data.count);
        setHasNext(Boolean(data.next));
      })
      .catch(() => setError("Не удалось загрузить объекты"))
      .finally(() => setLoading(false));
  }, [values, dealType, activeTab, page, source, authLoading]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (listing: Listing) => {
    if (!window.confirm(`Удалить объект ID:${listing.id}? Он попадёт в «Удалённые».`)) return;
    await api.deleteListing(listing.id);
    load();
  };

  const restore = async (listing: Listing) => {
    await api.restoreListing(listing.id);
    load();
  };

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{heading}</h1>
            <p className="mt-1 text-sm text-muted">
              {loading ? "Загрузка…" : `Найдено объектов: ${count}`}
            </p>
          </div>
          {canAdd && user && (
            <Link href={`/listings/new${dealType === "rent" ? "?deal_type=rent" : ""}`} className="btn btn-primary">
              Добавить
            </Link>
          )}
        </div>

        <FiltersBar
          fields={fields}
          dictionaries={dictionaries}
          values={values}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        {visibleTabs.length > 1 && (
          <Tabs tabs={visibleTabs} active={activeTab} onChange={changeTab} />
        )}

        {error ? (
          <div className="py-16 text-center">
            <h3 className="text-lg font-semibold">{error}</h3>
            <button onClick={load} className="btn btn-primary mt-4">
              Попробовать снова
            </button>
          </div>
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-[16/10] w-full rounded-xl bg-accent" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-accent" />
                  <div className="h-3 w-1/3 rounded bg-accent" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <h3 className="text-lg font-semibold">Ничего не найдено</h3>
            <p className="mt-1 text-sm text-muted">Попробуйте изменить параметры поиска.</p>
            <button onClick={resetFilters} className="btn btn-primary mt-4">
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  canManage={Boolean(user)}
                  onDelete={remove}
                  onRestore={restore}
                />
              ))}
            </div>

            {(page > 1 || hasNext) && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Назад
                </button>
                <span className="text-sm text-muted">Страница {page}</span>
                <button
                  className="btn btn-secondary"
                  disabled={!hasNext}
                  onClick={() => goToPage(page + 1)}
                >
                  Вперёд
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
