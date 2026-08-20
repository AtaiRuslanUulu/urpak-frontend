"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { api, formatDateTime, formatPrice } from "@/lib/api";
import type { Listing } from "@/lib/types";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right">{value}</span>
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
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{listing.title}</h1>
            <p className="mt-1 text-sm text-muted">
              ID:{listing.id} · {listing.deal_type === "rent" ? "Аренда" : "Продажа"} ·{" "}
              Дата созд: {formatDateTime(listing.created_at)}
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

            {listing.description && (
              <div className="card mt-6">
                <h2 className="mb-2 text-sm font-semibold">Описание</h2>
                <p className="whitespace-pre-line text-sm">{listing.description}</p>
              </div>
            )}
          </div>

          <aside>
            <div className="card">
              <div className="mb-3 text-2xl font-semibold">
                {formatPrice(listing.price, listing.currency)}
              </div>
              <Row label="Тип объекта" value={listing.property_type?.name} />
              <Row label="Статус" value={listing.status?.name} />
              <Row label="Район" value={listing.district?.name} />
              <Row label="ЖК" value={listing.complex?.name} />
              <Row label="Серия" value={listing.series?.name} />
              <Row
                label="Комнат"
                value={listing.rooms === 0 ? "Студия" : listing.rooms}
              />
              <Row
                label="Этаж"
                value={
                  listing.floor === null
                    ? null
                    : listing.total_floors
                    ? `${listing.floor} из ${listing.total_floors}`
                    : listing.floor
                }
              />
              <Row label="Площадь" value={listing.area_m2 ? `${listing.area_m2} м²` : null} />
              <Row label="Состояние" value={listing.condition?.name} />
              <Row label="Ориентир" value={listing.landmark} />
              <Row label="Куратор" value={listing.curator?.full_name} />
              <Row label="Телефон куратора" value={listing.curator?.phone} />
            </div>

            {user && (listing.owner_phone || listing.address || listing.internal_note) && (
              <div className="card mt-4">
                <h2 className="mb-2 text-sm font-semibold">Только для агентов</h2>
                <Row label="Телефон собственника" value={listing.owner_phone} />
                <Row label="Точный адрес" value={listing.address} />
                {listing.internal_note && (
                  <p className="mt-2 whitespace-pre-line text-sm text-muted">
                    {listing.internal_note}
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
