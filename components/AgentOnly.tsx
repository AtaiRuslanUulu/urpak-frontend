"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/AuthProvider";

/** Оборачивает разделы, доступные только вошедшим агентам. */
export default function AgentOnly({ children }: { children: React.ReactNode }) {
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

  return <>{children}</>;
}
