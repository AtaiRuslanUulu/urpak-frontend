"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/AuthProvider";

/** Разделы управления: учётки и справочники правит только руководство. */
export default function ManagerOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      const back = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(back)}`);
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className="container py-16 text-center text-sm text-muted">Загрузка…</div>;
  }
  if (!user) return null;

  if (!user.is_manager) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-xl font-semibold">Раздел только для руководителей</h1>
        <p className="mt-2 text-sm text-muted">
          Попросите руководителя агентства завести учётку или добавить значение в справочник.
        </p>
        <Link href="/" className="btn btn-primary mt-4">
          К вариантам
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
