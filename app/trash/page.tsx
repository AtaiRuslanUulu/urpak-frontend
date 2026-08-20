"use client";

import { Suspense } from "react";

import AgentOnly from "@/components/AgentOnly";
import ListingsBrowser from "@/components/ListingsBrowser";
import type { FilterKey } from "@/components/FiltersBar";

const FIELDS: FilterKey[] = [
  "id", "q", "property_type", "district", "rooms", "curator",
];

const TABS = [{ key: "all", label: "Все удалённые" }];

export default function TrashPage() {
  return (
    <AgentOnly>
      <Suspense fallback={<div className="container py-16 text-center text-sm text-muted">Загрузка…</div>}>
        <ListingsBrowser
          heading="Удалённые"
          fields={FIELDS}
          tabs={TABS}
          source="deleted"
          canAdd={false}
        />
      </Suspense>
    </AgentOnly>
  );
}
