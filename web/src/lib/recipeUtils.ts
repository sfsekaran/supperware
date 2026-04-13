export interface Ingredient {
  id: number;
  position: number;
  group_name: string | null;
  raw_text: string;
  quantity: number | null;
  quantity_max: number | null;
  unit: string | null;
  weight_grams: number | null;
  ingredient_name: string | null;
  preparation_notes: string | null;
  is_optional: boolean;
  parse_confidence?: number | null;
}

export interface Step {
  id: number;
  position: number;
  section_name: string | null;
  instruction: string;
  duration_minutes?: number | null;
}

export function formatQuantity(qty: number | null, scale: number): string {
  if (qty === null) return '';
  const val = qty * scale;
  if (val === Math.floor(val)) return String(val);
  return val.toFixed(1).replace(/\.0$/, '');
}
