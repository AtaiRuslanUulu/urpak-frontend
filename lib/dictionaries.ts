// lib/dictionaries.ts — общие метаданные справочников для интерфейса.
import type { DictionaryKind } from "./types";

export const DICTIONARY_LABELS: { kind: DictionaryKind; label: string }[] = [
  { kind: "property_types", label: "Типы объектов" },
  { kind: "districts", label: "Районы" },
  { kind: "complexes", label: "ЖК" },
  { kind: "series", label: "Серии домов" },
  { kind: "conditions", label: "Состояния" },
  { kind: "statuses", label: "Статусы объектов" },
  { kind: "stages", label: "Этапы" },
  { kind: "lines", label: "Линии" },
  { kind: "wall_materials", label: "Материалы стен" },
  { kind: "heatings", label: "Отопление" },
  { kind: "sewerages", label: "Канализация" },
  { kind: "furniture_options", label: "Мебель" },
  { kind: "documents", label: "Документы" },
  { kind: "payment_conditions", label: "Условия расчёта" },
];

/** Поле формы объекта → справочник, из которого оно берёт значения. */
export const FIELD_TO_KIND: Record<string, DictionaryKind> = {
  property_type: "property_types",
  district: "districts",
  complex: "complexes",
  series: "series",
  condition: "conditions",
  status: "statuses",
  stage: "stages",
  line: "lines",
  wall_material: "wall_materials",
  heating: "heatings",
  sewerage: "sewerages",
  furniture: "furniture_options",
  documents: "documents",
  payment_conditions: "payment_conditions",
};
