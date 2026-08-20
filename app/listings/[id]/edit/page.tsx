"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import AgentOnly from "@/components/AgentOnly";
import ListingForm from "@/components/ListingForm";
import { api } from "@/lib/api";
import type { Listing } from "@/lib/types";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    api
      .listing(params.id)
      .then(setListing)
      .catch(() => setError("Объект не найден"));
  }, [params?.id]);

  return (
    <AgentOnly>
      {error ? (
        <div className="container py-16 text-center">
          <h1 className="text-xl font-semibold">{error}</h1>
        </div>
      ) : listing ? (
        <ListingForm listing={listing} />
      ) : (
        <div className="container py-16 text-center text-sm text-muted">Загрузка…</div>
      )}
    </AgentOnly>
  );
}
