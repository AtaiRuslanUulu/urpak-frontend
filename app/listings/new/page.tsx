"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import AgentOnly from "@/components/AgentOnly";
import ListingForm from "@/components/ListingForm";

function NewListing() {
  const searchParams = useSearchParams();
  const dealType = searchParams.get("deal_type") === "rent" ? "rent" : "sale";
  return <ListingForm defaultDealType={dealType} />;
}

export default function NewListingPage() {
  return (
    <AgentOnly>
      <Suspense fallback={<div className="container py-16 text-center text-sm text-muted">Загрузка…</div>}>
        <NewListing />
      </Suspense>
    </AgentOnly>
  );
}
