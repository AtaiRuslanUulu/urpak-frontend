"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError, api } from "@/lib/api";
import type { Dictionaries, DictItem, Listing } from "@/lib/types";

type FormState = Record<string, string | boolean>;

const EMPTY: FormState = {
  deal_type: "sale",
  property_type: "",
  district: "",
  complex: "",
  series: "",
  condition: "",
  status: "",
  curator: "",
  rooms: "",
  floor: "",
  total_floors: "",
  area_m2: "",
  price: "",
  currency: "USD",
  landmark: "",
  description: "",
  owner_phone: "",
  address: "",
  internal_note: "",
  is_urgent: false,
  is_exclusive: false,
  is_alternative: false,
  is_barter: false,
};

const ROOMS: DictItem[] = [
  { id: "0", name: "Студия" },
  ...Array.from({ length: 6 }, (_, i) => ({ id: String(i + 1), name: `${i + 1}-ком` })),
];

interface Props {
  listing?: Listing;
  defaultDealType?: "sale" | "rent";
}

export default function ListingForm({ listing, defaultDealType = "sale" }: Props) {
  const router = useRouter();
  const [dictionaries, setDictionaries] = useState<Dictionaries | null>(null);
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
      rooms: listing.rooms === null ? "" : String(listing.rooms),
      floor: listing.floor === null ? "" : String(listing.floor),
      total_floors: listing.total_floors === null ? "" : String(listing.total_floors),
      area_m2: listing.area_m2 ?? "",
      price: listing.price ?? "",
      currency: listing.currency,
      landmark: listing.landmark ?? "",
      description: listing.description ?? "",
      owner_phone: listing.owner_phone ?? "",
      address: listing.address ?? "",
      internal_note: listing.internal_note ?? "",
      is_urgent: listing.is_urgent,
      is_exclusive: listing.is_exclusive,
      is_alternative: listing.is_alternative,
      is_barter: listing.is_barter,
    });
    setImages(listing.images);
  }, [listing]);

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});

    const body = new FormData();
    for (const [key, value] of Object.entries(form)) {
      if (typeof value === "boolean") {
        body.append(key, value ? "true" : "false");
      } else if (value !== "") {
        body.append(key, value);
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

  const Err = ({ name }: { name: string }) =>
    errors[name] ? <p className="mt-1 text-xs text-primary">{errors[name]}</p> : null;

  const select = (name: string, label: string, options: DictItem[], allowEmpty = true) => (
    <div>
      <label className="mb-1 block text-sm text-muted">{label}</label>
      <select
        className="select"
        value={String(form[name] ?? "")}
        onChange={(e) => set(name, e.target.value)}
      >
        {allowEmpty && <option value="">Не указано</option>}
        {options.map((option) => (
          <option key={option.id} value={String(option.id)}>
            {option.name}
          </option>
        ))}
      </select>
      <Err name={name} />
    </div>
  );

  const field = (name: string, label: string, type = "text") => (
    <div>
      <label className="mb-1 block text-sm text-muted">{label}</label>
      <input
        type={type}
        className="input"
        value={String(form[name] ?? "")}
        onChange={(e) => set(name, e.target.value)}
      />
      <Err name={name} />
    </div>
  );

  const checkbox = (name: string, label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={Boolean(form[name])}
        onChange={(e) => set(name, e.target.checked)}
      />
      {label}
    </label>
  );

  return (
    <form onSubmit={submit} className="container py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold">
          {listing ? `Редактирование ID:${listing.id}` : "Новый объект"}
        </h1>

        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold">Основное</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {select("deal_type", "Тип сделки", dictionaries?.deal_types ?? [], false)}
            {select("property_type", "Тип объекта", dictionaries?.property_types ?? [])}
            {select("status", "Статус", dictionaries?.statuses ?? [])}
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
            {field("landmark", "Ориентир (виден всем)")}
            {field("address", "Точный адрес (только агентам)")}
          </div>
        </section>

        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold">Параметры</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {select("rooms", "Комнат", ROOMS)}
            {field("floor", "Этаж", "number")}
            {field("total_floors", "Этажность", "number")}
            {field("area_m2", "Площадь, м²", "number")}
            {select("condition", "Состояние", dictionaries?.conditions ?? [])}
          </div>
        </section>

        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold">Цена</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {field("price", "Цена", "number")}
            {select("currency", "Валюта", dictionaries?.currencies ?? [], false)}
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
            <div>
              <label className="mb-1 block text-sm text-muted">Описание (видно всем)</label>
              <textarea
                className="input h-28 py-3"
                value={String(form.description ?? "")}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            {field("owner_phone", "Телефон собственника (только агентам)")}
            <div>
              <label className="mb-1 block text-sm text-muted">
                Внутренняя заметка (только агентам)
              </label>
              <textarea
                className="input h-24 py-3"
                value={String(form.internal_note ?? "")}
                onChange={(e) => set("internal_note", e.target.value)}
              />
            </div>
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
