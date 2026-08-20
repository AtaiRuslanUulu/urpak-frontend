// lib/types.ts — формы данных, которые отдаёт /api/agency/

export interface DictItem {
  id: number | string;
  name: string;
}

export interface AgentItem {
  id: number;
  full_name: string;
  phone?: string;
}

export interface Dictionaries {
  property_types: DictItem[];
  districts: DictItem[];
  series: DictItem[];
  complexes: DictItem[];
  conditions: DictItem[];
  statuses: DictItem[];
  agents: AgentItem[];
  deal_types: DictItem[];
  currencies: DictItem[];
}

export interface ListingImage {
  id: number;
  url: string | null;
  position: number;
}

export interface Listing {
  id: number;
  title: string;
  deal_type: "sale" | "rent";
  property_type: DictItem | null;
  district: DictItem | null;
  complex: DictItem | null;
  series: DictItem | null;
  condition: DictItem | null;
  status: DictItem | null;
  curator: AgentItem | null;
  rooms: number | null;
  floor: number | null;
  total_floors: number | null;
  area_m2: string | null;
  price: string;
  currency: "USD" | "KGS";
  landmark: string;
  description: string;
  is_urgent: boolean;
  is_exclusive: boolean;
  is_alternative: boolean;
  is_barter: boolean;
  images: ListingImage[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Приходят только вошедшим агентам.
  owner_phone?: string;
  address?: string;
  internal_note?: string;
}

export interface Deal {
  id: number;
  listing: number | null;
  listing_title?: string;
  curator: number | null;
  curator_name?: string;
  client_name: string;
  deal_date: string;
  amount: string;
  commission: string;
  currency: "USD" | "KGS";
  is_paid: boolean;
  note: string;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CurrentUser {
  id: number;
  username: string;
  is_staff: boolean;
  agent: AgentItem | null;
}
