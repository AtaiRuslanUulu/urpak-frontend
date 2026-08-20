"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";

function LoginForm() {
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      router.replace(next);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Неверный логин или пароль"
          : "Не удалось войти. Попробуйте позже."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-16">
      <form onSubmit={submit} className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-6">
        <h1 className="mb-1 text-xl font-semibold">Вход для агентов</h1>
        <p className="mb-6 text-sm text-muted">
          Добавление и правка объектов доступны после входа.
        </p>

        <label className="mb-1 block text-sm text-muted">Логин</label>
        <input
          className="input mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <label className="mb-1 block text-sm text-muted">Пароль</label>
        <input
          type="password"
          className="input mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="mb-4 text-sm text-primary">{error}</p>}

        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Входим…" : "Войти"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container py-16 text-center text-sm text-muted">Загрузка…</div>}>
      <LoginForm />
    </Suspense>
  );
}
