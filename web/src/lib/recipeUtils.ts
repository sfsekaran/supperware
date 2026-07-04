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

const UNIT_PLURALS: Record<string, string> = {
  teaspoon: 'teaspoons', tablespoon: 'tablespoons', cup: 'cups',
  pint: 'pints', quart: 'quarts', gallon: 'gallons', liter: 'liters',
  gram: 'grams', kilogram: 'kilograms', ounce: 'ounces', pound: 'pounds',
  pinch: 'pinches', dash: 'dashes', bunch: 'bunches',
  handful: 'handfuls', clove: 'cloves', slice: 'slices', piece: 'pieces',
  sprig: 'sprigs', stalk: 'stalks', can: 'cans', jar: 'jars',
  package: 'packages', sheet: 'sheets', stick: 'sticks', head: 'heads', drop: 'drops',
};

// qty=null → assume plural; abbreviations (ml, fl oz, etc.) pass through unchanged
export function pluralizeUnit(unit: string | null, qty: number | null, scale: number): string | null {
  if (unit === null) return null;
  const effective = qty !== null ? qty * scale : 2;
  if (effective === 1) return unit;
  return UNIT_PLURALS[unit] ?? unit;
}

export function formatQuantity(qty: number | null, scale: number): string {
  if (qty === null) return '';
  const val = qty * scale;
  if (val === Math.floor(val)) return String(val);
  // Use toFixed(2) to avoid IEEE 754 rounding issues (0.15.toFixed(1) → '0.1')
  // then strip trailing zeros: '0.150' → '0.15', '1.500' → '1.5'
  return val.toFixed(2).replace(/\.?0+$/, '');
}
