"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import { HiPhone } from "react-icons/hi";

import { useAuth } from "@/components/AuthProvider";
import { api, formatDateTime, formatPrice } from "@/lib/api";
import type { DictItem, Listing } from "@/lib/types";

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

/** null у коммуникаций значит «не выяснили» — строку прячем, а не врём «Нет». */
const yesNo = (value: boolean | null) =>
  value === null || value === undefined ? undefined : value ? "Да" : "Нет";

function Chips({ items }: { items: DictItem[] }) {
  if (!items?.length) return null;
  return (
    <span className="flex flex-wrap justify-end gap-1.5">
      {items.map((item) => (
        <span key={item.id} className="rounded-lg bg-accent px-2 py-0.5 text-xs">
          {item.name}
        </span>
      ))}
    </span>
  );
}

function CuratorContacts({ listing }: { listing: Listing }) {
  const curator = listing.curator;
  if (!curator) return null;

  const phone = curator.phone?.trim();
  const whatsapp = (curator.whatsapp || curator.phone || "").replace(/\D/g, "");
  const telegram = curator.telegram?.trim().replace(/^@/, "");

  if (!phone && !whatsapp && !telegram) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {phone && (
        <a href={`tel:${phone}`} className="btn btn-primary">
          {curator.full_name}
          <HiPhone className="ml-2" size={16} />
        </a>
      )}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary px-3"
          title="WhatsApp"
        >
          <FaWhatsapp size={18} />
        </a>
      )}
      {telegram && (
        <a
          href={`https://t.me/${telegram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary px-3"
          title="Telegram"
        >
          <FaTelegramPlane size={18} />
        </a>
      )}
    </div>
  );
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!params?.id) return;
    api
      .listing(params.id)
      .then(setListing)
      .catch(() => setError("Объект не найден"));
  }, [params?.id]);

  if (error) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-xl font-semibold">{error}</h1>
        <Link href="/" className="btn btn-primary mt-4">
          К списку вариантов
        </Link>
      </div>
    );
  }

  if (!listing) {
    return <div className="container py-16 text-center text-sm text-muted">Загрузка…</div>;
  }

  const photos = listing.images.filter((img) => img.url);
  const cover = photos[active]?.url ?? null;

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{listing.full_title}</h1>
            <p className="mt-1 text-sm text-muted">
              ID:{listing.id} · {listing.deal_type === "rent" ? "Аренда" : "Продажа"} ·{" "}
              Дата создания: {formatDateTime(listing.created_at)}
            </p>
          </div>
          {user && (
            <Link href={`/listings/${listing.id}/edit`} className="btn btn-secondary">
              Редактировать
            </Link>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div>
            {cover ? (
              <>
                <Image
                  src={cover}
                  alt={listing.title}
                  width={1200}
                  height={800}
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                  className="max-h-[480px] w-full rounded-2xl object-cover"
                />
                {photos.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {photos.map((img, index) => (
                      <button
                        key={img.id}
                        onClick={() => setActive(index)}
                        className={`overflow-hidden rounded-lg border-2 ${
                          index === active ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <Image
                          src={img.url as string}
                          alt=""
                          width={120}
                          height={90}
                          sizes="96px"
                          className="h-16 w-24 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="grid h-72 place-items-center rounded-2xl bg-accent text-sm text-muted">
                Без фото
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="text-2xl font-semibold">
                {formatPrice(listing.price, listing.currency)}
              </div>
              <CuratorContacts listing={listing} />
            </div>

            {listing.description && (
              <div className="card mt-6">
                <h2 className="mb-2 text-sm font-semibold">Описание объекта</h2>
                <p className="whitespace-pre-line text-sm">{listing.description}</p>
              </div>
            )}
          </div>

          <aside>
            <div className="card">
              <Row label="Тип объекта" value={listing.property_type?.name} />
              <Row label="Серия" value={listing.series?.name} />
              <Row label="Всего этажей" value={listing.total_floors} />
              <Row label="Этап" value={listing.stage?.name} />
              <Row
                label="Количество комнат"
                value={listing.rooms === 0 ? "Студия" : listing.rooms}
              />
              <Row label="Этаж" value={listing.floor} />
              <Row label="Площадь" value={listing.area_m2 ? `${listing.area_m2} м²` : null} />
              <Row label="Линия" value={listing.line?.name} />
              <Row label="Топосъёмка" value={yesNo(listing.has_topography)} />
              <Row label="Материал стен" value={listing.wall_material?.name} />
              <Row label="Состояние" value={listing.condition?.name} />
              <Row label="Год постройки по техпаспорту" value={listing.built_date} />
              <Row label="Остаётся мебель" value={listing.furniture?.name} />
              <Row label="Канализация" value={listing.sewerage?.name} />
              <Row label="Газ" value={yesNo(listing.has_gas)} />
              <Row label="Электричество" value={yesNo(listing.has_electricity)} />
              <Row label="Водоснабжение" value={yesNo(listing.has_water)} />
              <Row label="Отопление" value={listing.heating?.name} />
              <Row
                label="Документы"
                value={
                  listing.documents?.length ? <Chips items={listing.documents} /> : null
                }
              />
              <Row
                label="Какие условия рассматривает"
                value={
                  listing.payment_conditions?.length ? (
                    <Chips items={listing.payment_conditions} />
                  ) : null
                }
              />
              <Row label="Статус" value={listing.status?.name} />
              <Row label="Район" value={listing.district?.name} />
              <Row label="ЖК" value={listing.complex?.name} />
              <Row label="Ориентир" value={listing.landmark} />
              <Row label="Куратор" value={listing.curator?.full_name} />
            </div>

            {user &&
              (listing.owner_phone ||
                listing.address ||
                listing.sale_reason ||
                listing.internal_note) && (
                <div className="card mt-4">
                  <h2 className="mb-2 text-sm font-semibold">Только для агентов</h2>
                  <Row label="Телефон собственника" value={listing.owner_phone} />
                  <Row label="Точный адрес" value={listing.address} />
                  <Row label="Причина продажи" value={listing.sale_reason} />
                  {listing.internal_note && (
                    <p className="mt-2 whitespace-pre-line text-sm text-muted">
                      {listing.internal_note}
                    </p>
                  )}
                </div>
              )}
          </aside>
        </div>

        {listing.curator_history?.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">История куратора</h2>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <tbody>
                  {listing.curator_history.map((record) => (
                    <tr key={record.id} className="border-b border-border last:border-0">
                      <td className="p-3">Куратор: {record.agent_name}</td>
                      <td className="p-3 text-right text-muted">
                        {formatDateTime(record.assigned_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
