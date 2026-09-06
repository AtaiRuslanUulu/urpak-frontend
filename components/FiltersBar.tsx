"use client";

import { useEffect, useState } from "react";
import { HiChevronDown, HiChevronUp, HiRefresh, HiSearch } from "react-icons/hi";

import type { Dictionaries, DictItem } from "@/lib/types";

export type FilterKey =
  | "id"
  | "q"
  | "property_type"
  | "complex"
  | "series"
  | "floor"
  | "condition"
  | "rooms"
  | "status"
  | "district"
  | "price_min"
  | "price_max"
  | "area"
  | "curator";

export type FilterValues = Record<string, string>;

interface Props {
  fields: FilterKey[];
  dictionaries: Dictionaries | null;
  values: FilterValues;
  onApply: (values: FilterValues) => void;
  onReset: () => void;
}

const FLOORS = Array.from({ length: 20 }, (_, i) => String(i + 1));
const ROOMS: DictItem[] = [
  { id: "0", name: "Студия" },
  ...Array.from({ length: 6 }, (_, i) => ({ id: String(i + 1), name: `${i + 1}-ком` })),
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted">{label}</label>
      {children}
    </div>
  );
}

export default function FiltersBar({
  fields, dictionaries, values, onApply, onReset,
}: Props) {
  const [draft, setDraft] = useState<FilterValues>(values);
  // На телефоне тринадцать полей в столбик отодвигают первую карточку на
  // четыре экрана вниз, поэтому по умолчанию панель свёрнута.
  const [open, setOpen] = useState(false);

  // Значения приходят из адресной строки — синхронизируем при навигации.
  useEffect(() => setDraft(values), [values]);

  const set = (key: string, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  /** Селекты применяются сразу, текстовые поля — по Enter или кнопке «Обновить». */
  const setAndApply = (key: string, value: string) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    onApply(next);
  };

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onApply(draft);
  };

  const select = (key: FilterKey, label: string, options: DictItem[]) => (
    <Field key={key} label={label}>
      <select
        className="select"
        value={draft[key] ?? ""}
        onChange={(e) => setAndApply(key, e.target.value)}
      >
        <option value="">Все</option>
        {options.map((option) => (
          <option key={option.id} value={String(option.id)}>
            {option.name}
          </option>
        ))}
      </select>
    </Field>
  );

  const number = (key: FilterKey, label: string, placeholder = "") => (
    <Field key={key} label={label}>
      <input
        type="number"
        className="input"
        placeholder={placeholder}
        value={draft[key] ?? ""}
        onChange={(e) => set(key, e.target.value)}
        onKeyDown={onEnter}
      />
    </Field>
  );

  const renderField = (key: FilterKey) => {
    const dict = dictionaries;
    switch (key) {
      case "id":
        return number("id", "Поиск по id");
      case "q":
        return (
          <Field key="q" label="Поиск ключевым словам">
            <input
              className="input"
              value={draft.q ?? ""}
              onChange={(e) => set("q", e.target.value)}
              onKeyDown={onEnter}
            />
          </Field>
        );
      case "property_type":
        return select("property_type", "Тип объекта", dict?.property_types ?? []);
      case "complex":
        return select("complex", "ЖК", dict?.complexes ?? []);
      case "series":
        return select("series", "Серия", dict?.series ?? []);
      case "condition":
        return select("condition", "Состояние", dict?.conditions ?? []);
      case "status":
        return select("status", "Статус", dict?.statuses ?? []);
      case "district":
        return select("district", "Районы", dict?.districts ?? []);
      case "curator":
        return select(
          "curator",
          "Куратор",
          (dict?.agents ?? []).map((a) => ({ id: a.id, name: a.full_name }))
        );
      case "rooms":
        return select("rooms", "Комната", ROOMS);
      case "floor":
        return select("floor", "Этаж", FLOORS.map((f) => ({ id: f, name: f })));
      case "price_min":
        return number("price_min", "Цена от", "0");
      case "price_max":
        return number("price_max", "Цена до", "0");
      case "area":
        return (
          <Field key="area" label="м²">
            <div className="flex gap-2">
              <input
                type="number"
                className="input"
                placeholder="с"
                value={draft.area_min ?? ""}
                onChange={(e) => set("area_min", e.target.value)}
                onKeyDown={onEnter}
              />
              <input
                type="number"
                className="input"
                placeholder="по"
                value={draft.area_max ?? ""}
                onChange={(e) => set("area_max", e.target.value)}
                onKeyDown={onEnter}
              />
            </div>
          </Field>
        );
      default:
        return null;
    }
  };

  const activeCount = Object.entries(draft).filter(
    ([, value]) => value !== "" && value != null
  ).length;

  const quickSearchKey: FilterKey | null = fields.includes("q")
    ? "q"
    : fields.includes("id")
    ? "id"
    : null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-4">
      {/* Телефон: строка поиска и кнопка, всё остальное — под ней */}
      <div className="flex gap-2 md:hidden">
        {quickSearchKey && !open && (
          <div className="relative flex-1">
            <input
              className="input pl-10"
              type={quickSearchKey === "id" ? "number" : "text"}
              placeholder={quickSearchKey === "id" ? "Поиск по id" : "Поиск"}
              value={draft[quickSearchKey] ?? ""}
              onChange={(e) => set(quickSearchKey, e.target.value)}
              onKeyDown={onEnter}
            />
            <HiSearch
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              size={18}
            />
          </div>
        )}
        <button
          type="button"
          className={`${activeCount > 0 ? "btn btn-primary" : "btn btn-secondary"} ${
            open ? "flex-1" : ""
          }`}
          onClick={() => setOpen((v) => !v)}
        >
          Фильтры{activeCount > 0 ? ` · ${activeCount}` : ""}
          {open ? (
            <HiChevronUp className="ml-1" size={16} />
          ) : (
            <HiChevronDown className="ml-1" size={16} />
          )}
        </button>
      </div>

      <div
        className={`${open ? "mt-3 grid" : "hidden"} grid-cols-1 gap-3 md:mt-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`}
      >
        {fields.map(renderField)}
      </div>

      <div className={`${open ? "flex" : "hidden"} mt-4 items-center gap-3 md:flex`}>
        <button className="btn btn-primary" onClick={() => onApply(draft)}>
          <HiRefresh className="mr-2" size={18} />
          Обновить
        </button>
        {activeCount > 0 && (
          <button className="btn btn-secondary" onClick={onReset}>
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
