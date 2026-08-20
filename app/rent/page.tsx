"use client";

import { Suspense } from "react";

import ListingsBrowser from "@/components/ListingsBrowser";
import type { FilterKey } from "@/components/FiltersBar";

const FIELDS: FilterKey[] = [
  "id", "property_type", "floor", "condition", "rooms", "status",
  "district", "price_min", "price_max", "curator",
];

const TABS = [
  { key: "all", label: "Все варианты" },
  { key: "mine", label: "Мои варианты" },
];

export default function RentPage() {
  return (
    <Suspense fallback={<div className="container py-16 text-center text-sm text-muted">Загрузка…</div>}>
      <ListingsBrowser heading="Аренда" dealType="rent" fields={FIELDS} tabs={TABS} />
    </Suspense>
  );
}
