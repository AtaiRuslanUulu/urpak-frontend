// lib/types.ts — формы данных, которые отдаёт /api/agency/

export interface DictItem {
  id: number | string;
  name: string;
}

export interface AgentItem {
  id: number;
  full_name: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
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
  stages: DictItem[];
  lines: DictItem[];
  wall_materials: DictItem[];
  heatings: DictItem[];
  sewerages: DictItem[];
  furniture_options: DictItem[];
  documents: DictItem[];
  payment_conditions: DictItem[];
}

export interface CuratorAssignment {
  id: number;
  agent: number;
  agent_name: string;
  assigned_at: string;
}

export interface ListingImage {
  id: number;
  url: string | null;
  position: number;
}

export interface Listing {
  id: number;
  title: string;
  full_title: string;
  deal_type: "sale" | "rent";
  property_type: DictItem | null;
  district: DictItem | null;
  complex: DictItem | null;
  series: DictItem | null;
  condition: DictItem | null;
  status: DictItem | null;
  curator: AgentItem | null;
  stage: DictItem | null;
  line: DictItem | null;
  wall_material: DictItem | null;
  heating: DictItem | null;
  sewerage: DictItem | null;
  furniture: DictItem | null;
  documents: DictItem[];
  payment_conditions: DictItem[];
  rooms: number | null;
  floor: number | null;
  total_floors: number | null;
  area_m2: string | null;
  built_date: string | null;
  has_gas: boolean | null;
  has_electricity: boolean | null;
  has_water: boolean | null;
  has_topography: boolean | null;
  price: string;
  currency: "USD" | "KGS";
  landmark: string;
  description: string;
  is_urgent: boolean;
  is_exclusive: boolean;
  is_alternative: boolean;
  is_barter: boolean;
  images: ListingImage[];
  curator_history: CuratorAssignment[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Приходят только вошедшим агентам.
  owner_phone?: string;
  address?: string;
  internal_note?: string;
  sale_reason?: string;
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
  is_manager: boolean;
  agent: AgentItem | null;
}

/** Агент в разделе управления — с логином и ролью. */
export interface AgentRow {
  id: number;
  username: string;
  full_name: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  is_active: boolean;
  is_manager: boolean;
  listings_count: number;
}

export interface DictionaryEntry {
  id: number;
  name: string;
  position: number;
  is_active: boolean;
}

/** Ключи совпадают с /api/agency/dictionaries/<kind>/ */
export type DictionaryKind =
  | "property_types"
  | "districts"
  | "series"
  | "complexes"
  | "conditions"
  | "statuses"
  | "stages"
  | "lines"
  | "wall_materials"
  | "heatings"
  | "sewerages"
  | "furniture_options"
  | "documents"
  | "payment_conditions";
