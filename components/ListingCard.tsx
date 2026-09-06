"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HiPencilAlt, HiRefresh, HiShare, HiTrash } from "react-icons/hi";

import { formatDateTime, formatPrice } from "@/lib/api";
import type { Listing } from "@/lib/types";

interface Props {
  listing: Listing;
  canManage: boolean;
  onDelete?: (listing: Listing) => void;
  onRestore?: (listing: Listing) => void;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
      {children}
    </span>
  );
}

export default function ListingCard({ listing, canManage, onDelete, onRestore }: Props) {
  const [copied, setCopied] = useState(false);
  const cover = listing.images.find((img) => img.url)?.url ?? null;

  const share = async () => {
    const url = `${window.location.origin}/listings/${listing.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Ссылка на объект:", url);
    }
  };

  return (
    <article className="card flex h-full flex-col">
      <Link href={`/listings/${listing.id}`} className="relative mb-3 block overflow-hidden rounded-xl">
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            width={900}
            height={560}
            // Без sizes браузер тянет вариант 1920px в карточку шириной 343px
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="grid h-48 w-full place-items-center bg-accent text-sm text-muted">
            Без фото
          </div>
        )}
        {listing.is_urgent && (
          <span className="absolute left-2 top-2 rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
            Срочно
          </span>
        )}
      </Link>

      <Link href={`/listings/${listing.id}`} className="text-sm font-semibold hover:opacity-80">
        {listing.title}
        <span className="ml-2 text-muted">ID:{listing.id}</span>
      </Link>

      <div className="mt-2 text-base font-semibold">
        {formatPrice(listing.price, listing.currency)}
      </div>

      {(listing.is_exclusive || listing.is_alternative || listing.is_barter || listing.status) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {listing.status && <Chip>{listing.status.name}</Chip>}
          {listing.is_exclusive && <Chip>Эксклюзив</Chip>}
          {listing.is_alternative && <Chip>Альтернатива</Chip>}
          {listing.is_barter && <Chip>Бартер</Chip>}
        </div>
      )}

      {canManage && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={share}
            className="btn btn-secondary px-3 py-2"
            title="Скопировать ссылку"
          >
            <HiShare size={16} />
            {copied && <span className="ml-2 text-xs">Скопировано</span>}
          </button>

          {listing.deleted_at ? (
            <button
              onClick={() => onRestore?.(listing)}
              className="btn btn-secondary px-3 py-2"
              title="Восстановить"
            >
              <HiRefresh size={16} />
              <span className="ml-2 text-xs">Восстановить</span>
            </button>
          ) : (
            <>
              <Link
                href={`/listings/${listing.id}/edit`}
                className="btn btn-secondary px-3 py-2"
                title="Редактировать"
              >
                <HiPencilAlt size={16} />
              </Link>
              <button
                onClick={() => onDelete?.(listing)}
                className="btn btn-secondary px-3 py-2"
                title="Удалить"
              >
                <HiTrash size={16} />
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-auto pt-3 text-xs text-muted">
        {listing.curator && <div>Куратор: {listing.curator.full_name}</div>}
        <div>Дата созд: {formatDateTime(listing.created_at)}</div>
      </div>
    </article>
  );
}
