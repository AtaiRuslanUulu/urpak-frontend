"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { ApiError, api } from "@/lib/api";
import { FIELD_TO_KIND } from "@/lib/dictionaries";
import type { Dictionaries, DictItem, Listing } from "@/lib/types";

type FormValue = string | boolean | string[];
type FormState = Record<string, FormValue>;

/** Коммуникации трёхпозиционные: "" — не указано, иначе "true"/"false". */
const TRISTATE_FIELDS = ["has_gas", "has_electricity", "has_water", "has_topography"];
const MULTI_FIELDS = ["documents", "payment_conditions"];
const FLAG_FIELDS = ["is_urgent", "is_exclusive", "is_alternative", "is_barter"];

const EMPTY: FormState = {
  deal_type: "sale",
  property_type: "",
  district: "",
  complex: "",
  series: "",
  condition: "",
  status: "",
  curator: "",
  stage: "",
  line: "",
  wall_material: "",
  heating: "",
  sewerage: "",
  furniture: "",
  documents: [],
  payment_conditions: [],
  rooms: "",
  floor: "",
  total_floors: "",
  area_m2: "",
  built_date: "",
  has_gas: "",
  has_electricity: "",
  has_water: "",
  has_topography: "",
  price: "",
  currency: "USD",
  landmark: "",
  description: "",
  owner_phone: "",
  address: "",
  internal_note: "",
  sale_reason: "",
  is_urgent: false,
  is_exclusive: false,
  is_alternative: false,
  is_barter: false,
};

const ROOMS: DictItem[] = [
  { id: "0", name: "Студия" },
  ...Array.from({ length: 6 }, (_, i) => ({ id: String(i + 1), name: `${i + 1}-ком` })),
];

const YES_NO: DictItem[] = [
  { id: "true", name: "Да" },
  { id: "false", name: "Нет" },
];

const asString = (value: FormValue | undefined) =>
  typeof value === "string" ? value : "";

const asList = (value: FormValue | undefined) => (Array.isArray(value) ? value : []);

const triState = (value: boolean | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

interface Props {
  listing?: Listing;
  defaultDealType?: "sale" | "rent";
}

export default function ListingForm({ listing, defaultDealType = "sale" }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [dictionaries, setDictionaries] = useState<Dictionaries | null>(null);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY, deal_type: defaultDealType });
  const [files, setFiles] = useState<File[]>([]);
  const [images, setImages] = useState(listing?.images ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.dictionaries().then(setDictionaries).catch(() => setDictionaries(null));
  }, []);

  useEffect(() => {
    if (!listing) return;
    setForm({
      deal_type: listing.deal_type,
      property_type: String(listing.property_type?.id ?? ""),
      district: String(listing.district?.id ?? ""),
      complex: String(listing.complex?.id ?? ""),
      series: String(listing.series?.id ?? ""),
      condition: String(listing.condition?.id ?? ""),
      status: String(listing.status?.id ?? ""),
      curator: String(listing.curator?.id ?? ""),
      stage: String(listing.stage?.id ?? ""),
      line: String(listing.line?.id ?? ""),
      wall_material: String(listing.wall_material?.id ?? ""),
      heating: String(listing.heating?.id ?? ""),
      sewerage: String(listing.sewerage?.id ?? ""),
      furniture: String(listing.furniture?.id ?? ""),
      documents: (listing.documents ?? []).map((d) => String(d.id)),
      payment_conditions: (listing.payment_conditions ?? []).map((c) => String(c.id)),
      rooms: listing.rooms === null ? "" : String(listing.rooms),
      floor: listing.floor === null ? "" : String(listing.floor),
      total_floors: listing.total_floors === null ? "" : String(listing.total_floors),
      area_m2: listing.area_m2 ?? "",
      built_date: listing.built_date ?? "",
      has_gas: triState(listing.has_gas),
      has_electricity: triState(listing.has_electricity),
      has_water: triState(listing.has_water),
      has_topography: triState(listing.has_topography),
      price: listing.price ?? "",
      currency: listing.currency,
      landmark: listing.landmark ?? "",
      description: listing.description ?? "",
      owner_phone: listing.owner_phone ?? "",
      address: listing.address ?? "",
      internal_note: listing.internal_note ?? "",
      sale_reason: listing.sale_reason ?? "",
      is_urgent: listing.is_urgent,
      is_exclusive: listing.is_exclusive,
      is_alternative: listing.is_alternative,
      is_barter: listing.is_barter,
    });
    setImages(listing.images);
  }, [listing]);

  const set = (key: string, value: FormValue) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleInList = (key: string, id: string) =>
    setForm((prev) => {
      const current = asList(prev[key]);
      return {
        ...prev,
        [key]: current.includes(id)
          ? current.filter((value) => value !== id)
          : [...current, id],
      };
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});

    const body = new FormData();
    for (const [key, value] of Object.entries(form)) {
      if (MULTI_FIELDS.includes(key)) {
        const list = asList(value);
        // Пустая строка = «снято всё»: иначе бэкенд оставит прежний набор.
        if (list.length === 0) body.append(key, "");
        else list.forEach((id) => body.append(key, id));
      } else if (TRISTATE_FIELDS.includes(key)) {
        body.append(key, asString(value));
      } else if (FLAG_FIELDS.includes(key)) {
        body.append(key, value ? "true" : "false");
      } else if (value !== "") {
        body.append(key, String(value));
      }
    }
    files.forEach((file) => body.append("images", file));

    try {
      const saved = listing
        ? await api.updateListing(listing.id, body)
        : await api.createListing(body);
      router.push(`/listings/${saved.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors());
      } else {
        setErrors({ detail: "Не удалось сохранить объект" });
      }
      setBusy(false);
    }
  };

  const dropImage = async (imageId: number) => {
    if (!listing) return;
    await api.removeImage(listing.id, imageId);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  /** Руководителю не нужно уходить в справочники, чтобы завести новый ЖК. */
  const saveDictionaryEntry = async (name: string) => {
    const kind = FIELD_TO_KIND[name];
    const value = newEntry.trim();
    if (!kind || !value) return;
    setAddError(null);
    try {
      const created = await api.createDictionaryEntry(kind, value);
      setDictionaries((prev) =>
        prev ? { ...prev, [kind]: [...prev[kind], { id: created.id, name: created.name }] } : prev
      );
      if (MULTI_FIELDS.includes(name)) toggleInList(name, String(created.id));
      else set(name, String(created.id));
      setAddingFor(null);
      setNewEntry("");
    } catch (err) {
      setAddError(
        err instanceof ApiError
          ? err.fieldErrors().name || "Не удалось добавить"
          : "Не удалось добавить"
      );
    }
  };

  const addEntryLink = (name: string) => {
    if (!user?.is_manager || !FIELD_TO_KIND[name]) return null;
    return (
      <button
        type="button"
        className="text-xs text-muted underline-offset-2 hover:text-fg hover:underline"
        onClick={() => {
          setAddingFor(name);
          setNewEntry("");
          setAddError(null);
        }}
      >
        + добавить
      </button>
    );
  };

  const addEntryForm = (name: string) => {
    if (addingFor !== name) return null;
    return (
      <div className="mt-2">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Новое значение"
            value={newEntry}
            autoFocus
            onChange={(e) => setNewEntry(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveDictionaryEntry(name);
              }
              if (e.key === "Escape") setAddingFor(null);
            }}
          />
          <button
            type="button"
            className="btn btn-primary px-3"
            onClick={() => saveDictionaryEntry(name)}
          >
            ОК
          </button>
          <button
            type="button"
            className="btn btn-secondary px-3"
            onClick={() => setAddingFor(null)}
          >
            ✕
          </button>
        </div>
        {addError && <p className="mt-1 text-xs text-primary">{addError}</p>}
      </div>
    );
  };

  const err = (name: string) =>
    errors[name] ? <p className="mt-1 text-xs text-primary">{errors[name]}</p> : null;

  const select = (
    name: string,
    label: string,
    options: DictItem[],
    emptyLabel: string | null = "Не указано"
  ) => (
    <div key={name}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label className="text-sm text-muted">{label}</label>
        {addEntryLink(name)}
      </div>
      <select
        className="select"
        value={asString(form[name])}
        onChange={(e) => set(name, e.target.value)}
      >
        {emptyLabel !== null && <option value="">{emptyLabel}</option>}
        {options.map((option) => (
          <option key={option.id} value={String(option.id)}>
            {option.name}
          </option>
        ))}
      </select>
      {addEntryForm(name)}
      {err(name)}
    </div>
  );

  const field = (name: string, label: string, type = "text") => (
    <div key={name}>
      <label className="mb-1 block text-sm text-muted">{label}</label>
      <input
        type={type}
        className="input"
        value={asString(form[name])}
        onChange={(e) => set(name, e.target.value)}
      />
      {err(name)}
    </div>
  );

  const textarea = (name: string, label: string, rows = "h-28") => (
    <div key={name}>
      <label className="mb-1 block text-sm text-muted">{label}</label>
      <textarea
        className={`input ${rows} py-3`}
        value={asString(form[name])}
        onChange={(e) => set(name, e.target.value)}
      />
      {err(name)}
    </div>
  );

  const checkbox = (name: string, label: string) => (
    <label key={name} className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={Boolean(form[name])}
        onChange={(e) => set(name, e.target.checked)}
      />
      {label}
    </label>
  );

  const multi = (name: string, label: string, options: DictItem[]) => {
    const chosen = asList(form[name]);
    return (
      <div key={name}>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <label className="text-sm text-muted">{label}</label>
          {addEntryLink(name)}
        </div>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const id = String(option.id);
            const active = chosen.includes(id);
            return (
              <button
                type="button"
                key={id}
                onClick={() => toggleInList(name, id)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted hover:text-fg"
                }`}
              >
                {option.name}
              </button>
            );
          })}
        </div>
        {addEntryForm(name)}
        {err(name)}
      </div>
    );
  };

  return (
    <form onSubmit={submit} className="container py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold">
          {listing ? `Редактирование ID:${listing.id}` : "Новый объект"}
        </h1>

        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold">Основное</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {select("deal_type", "Тип сделки", dictionaries?.deal_types ?? [], null)}
            {select("property_type", "Тип объекта", dictionaries?.property_types ?? [])}
            {select("status", "Статус", dictionaries?.statuses ?? [])}
            {select("stage", "Этап", dictionaries?.stages ?? [])}
            {select(
              "curator",
              "Куратор",
              (dictionaries?.agents ?? []).map((a) => ({ id: a.id, name: a.full_name }))
            )}
          </div>
        </section>

        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold">Расположение</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {select("district", "Район", dictionaries?.districts ?? [])}
            {select("complex", "ЖК", dictionaries?.complexes ?? [])}
            {select("series", "Серия", dictionaries?.series ?? [])}
            {select("line", "Линия", dictionaries?.lines ?? [])}
            {field("landmark", "Ориентир (виден всем)")}
            {field("address", "Точный адрес (только агентам)")}
          </div>
        </section>

        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold">Параметры</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {select("rooms", "Комнат", ROOMS)}
            {field("floor", "Этаж", "number")}
            {field("total_floors", "Всего этажей", "number")}
            {field("area_m2", "Площадь, м²", "number")}
            {select("condition", "Состояние", dictionaries?.conditions ?? [])}
            {select("wall_material", "Материал стен", dictionaries?.wall_materials ?? [])}
            {field("built_date", "Год постройки по техпаспорту", "date")}
            {select("furniture", "Остаётся мебель", dictionaries?.furniture_options ?? [])}
            {select("has_topography", "Топосъёмка", YES_NO)}
          </div>
        </section>

        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold">Коммуникации</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {select("heating", "Отопление", dictionaries?.heatings ?? [])}
            {select("sewerage", "Канализация", dictionaries?.sewerages ?? [])}
            {select("has_gas", "Газ", YES_NO)}
            {select("has_electricity", "Электричество", YES_NO)}
            {select("has_water", "Водоснабжение", YES_NO)}
          </div>
        </section>

        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold">Сделка</h2>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {field("price", "Цена", "number")}
            {select("currency", "Валюта", dictionaries?.currencies ?? [], null)}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {multi("documents", "Документы", dictionaries?.documents ?? [])}
            {multi(
              "payment_conditions",
              "Какие условия рассматривает",
              dictionaries?.payment_conditions ?? []
            )}
            {textarea("sale_reason", "Причина продажи (только агентам)", "h-20")}
          </div>
        </section>

        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold">Метки</h2>
          <div className="flex flex-wrap gap-4">
            {checkbox("is_urgent", "Срочно")}
            {checkbox("is_exclusive", "Эксклюзив")}
            {checkbox("is_alternative", "Альтернатива")}
            {checkbox("is_barter", "Бартер")}
          </div>
        </section>

        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold">Описание и контакты</h2>
          <div className="grid grid-cols-1 gap-3">
            {textarea("description", "Описание объекта (видно всем)")}
            {field("owner_phone", "Телефон собственника (только агентам)")}
            {textarea("internal_note", "Внутренняя заметка (только агентам)", "h-24")}
          </div>
        </section>

        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold">Фотографии</h2>
          {images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-3">
              {images.map((img) =>
                img.url ? (
                  <div key={img.id} className="relative">
                    <Image
                      src={img.url}
                      alt=""
                      width={160}
                      height={120}
                      className="h-24 w-32 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => dropImage(img.id)}
                      className="absolute right-1 top-1 rounded-md bg-card px-2 py-0.5 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : null
              )}
            </div>
          )}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="text-sm"
          />
          {files.length > 0 && (
            <p className="mt-2 text-xs text-muted">Будет загружено файлов: {files.length}</p>
          )}
        </section>

        {errors.detail && <p className="mb-4 text-sm text-primary">{errors.detail}</p>}

        <div className="flex gap-3">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Сохраняем…" : "Сохранить"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
            Отмена
          </button>
        </div>
      </div>
    </form>
  );
}
