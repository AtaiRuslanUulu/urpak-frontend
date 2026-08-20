// lib/api.ts — тонкий клиент к /api/agency/ с JWT и обновлением токена.
import type {
  AgentRow, CurrentUser, Deal, Dictionaries, DictionaryEntry, DictionaryKind,
  Listing, Paginated,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

const ROOT = `${API_BASE}/api/agency`;

const ACCESS_KEY = "urpak_access";
const REFRESH_KEY = "urpak_refresh";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : `Ошибка запроса (${status})`);
    this.status = status;
    this.detail = detail;
  }

  /** Ошибки валидации DRF: { поле: ["текст"] } */
  fieldErrors(): Record<string, string> {
    if (!this.detail || typeof this.detail !== "object") return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.detail as Record<string, unknown>)) {
      out[key] = Array.isArray(value) ? String(value[0]) : String(value);
    }
    return out;
  }
}

export const tokens = {
  access: () => (typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY)),
  refresh: () => (typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY)),
  save(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

async function refreshAccess(): Promise<boolean> {
  const refresh = tokens.refresh();
  if (!refresh) return false;

  const res = await fetch(`${ROOT}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    tokens.clear();
    return false;
  }
  const data = await res.json();
  tokens.save(data.access);
  return true;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  const access = tokens.access();
  if (access) headers.set("Authorization", `Bearer ${access}`);
  // FormData сам выставляет boundary — Content-Type трогать нельзя.
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${ROOT}${path}`, { ...init, headers, cache: "no-store" });

  if (res.status === 401 && retry && (await refreshAccess())) {
    return request<T>(path, init, false);
  }
  if (!res.ok) {
    let detail: unknown = null;
    try {
      detail = await res.json();
    } catch {
      detail = await res.text();
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Пустые значения не уезжают в querystring — иначе фильтр «Все» отсечёт всё. */
export function toQuery(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  return search.toString();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ access: string; refresh: string }>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  me: () => request<CurrentUser>("/auth/me/"),

  dictionaries: () => request<Dictionaries>("/dictionaries/"),

  listings: (params: Record<string, string | number | undefined | null>) => {
    const query = toQuery(params);
    return request<Paginated<Listing>>(`/listings/${query ? `?${query}` : ""}`);
  },

  deletedListings: (params: Record<string, string | number | undefined | null>) => {
    const query = toQuery(params);
    return request<Paginated<Listing>>(`/listings/deleted/${query ? `?${query}` : ""}`);
  },

  listing: (id: number | string) => request<Listing>(`/listings/${id}/`),

  createListing: (body: FormData) =>
    request<Listing>("/listings/", { method: "POST", body }),

  updateListing: (id: number | string, body: FormData) =>
    request<Listing>(`/listings/${id}/`, { method: "PATCH", body }),

  deleteListing: (id: number | string) =>
    request<void>(`/listings/${id}/`, { method: "DELETE" }),

  restoreListing: (id: number | string) =>
    request<Listing>(`/listings/${id}/restore/`, { method: "POST" }),

  removeImage: (listingId: number | string, imageId: number) =>
    request<void>(`/listings/${listingId}/images/${imageId}/`, { method: "DELETE" }),

  updateProfile: (body: Record<string, unknown>) =>
    request<CurrentUser>("/auth/me/", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ detail: string }>("/auth/password/", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }),

  agents: () => request<AgentRow[]>("/agents/"),

  createAgent: (body: Record<string, unknown>) =>
    request<AgentRow>("/agents/", { method: "POST", body: JSON.stringify(body) }),

  updateAgent: (id: number, body: Record<string, unknown>) =>
    request<AgentRow>(`/agents/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deactivateAgent: (id: number) =>
    request<void>(`/agents/${id}/`, { method: "DELETE" }),

  dictionaryEntries: (kind: DictionaryKind) =>
    request<DictionaryEntry[]>(`/dictionaries/${kind}/`),

  createDictionaryEntry: (kind: DictionaryKind, name: string) =>
    request<DictionaryEntry>(`/dictionaries/${kind}/`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  updateDictionaryEntry: (
    kind: DictionaryKind,
    id: number,
    body: Record<string, unknown>
  ) =>
    request<DictionaryEntry>(`/dictionaries/${kind}/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  /** Занятое значение сервер прячет вместо удаления и говорит об этом. */
  deleteDictionaryEntry: (kind: DictionaryKind, id: number) =>
    request<{ detail?: string } | void>(`/dictionaries/${kind}/${id}/`, {
      method: "DELETE",
    }),

  deals: () => request<Paginated<Deal>>("/deals/"),

  createDeal: (body: Record<string, unknown>) =>
    request<Deal>("/deals/", { method: "POST", body: JSON.stringify(body) }),

  updateDeal: (id: number, body: Record<string, unknown>) =>
    request<Deal>(`/deals/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),

  deleteDeal: (id: number) => request<void>(`/deals/${id}/`, { method: "DELETE" }),
};

export function formatPrice(price: string | number, currency: "USD" | "KGS") {
  const value = Number(price);
  if (Number.isNaN(value)) return "—";
  const amount = value.toLocaleString("ru-RU", { maximumFractionDigits: 0 });
  return currency === "USD" ? `$${amount}` : `${amount} сом`;
}

export function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
