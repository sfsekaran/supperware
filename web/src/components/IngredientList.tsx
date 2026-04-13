import { type Ingredient, formatQuantity, pluralizeUnit } from '../lib/recipeUtils';

interface Props {
  ingredients: Ingredient[];
  scale: number;
  checkedIngredients: Set<number>;
  onToggle: (id: number) => void;
}

export function IngredientList({ ingredients, scale, checkedIngredients, onToggle }: Props) {
  const groups: { name: string | null; items: Ingredient[] }[] = [];
  for (const ing of ingredients) {
    const last = groups[groups.length - 1];
    if (!last || last.name !== ing.group_name) {
      groups.push({ name: ing.group_name, items: [ing] });
    } else {
      last.items.push(ing);
    }
  }

  return (
    <>
      {groups.map((group, gi) => (
        <div key={gi} className="mb-5">
          {group.name && (
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-warm-gray)' }}>
              {group.name}
            </p>
          )}
          <ul className="space-y-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {group.items.map((ing) => {
              const checked = checkedIngredients.has(ing.id);
              return (
                <li key={ing.id}>
                  <button
                    onClick={() => onToggle(ing.id)}
                    className="flex items-start gap-3 text-left w-full rounded-lg px-2 py-1.5 transition-colors"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: checked ? 0.4 : 1 }}
                  >
                    <div className="w-4 h-4 rounded border-2 mt-0.5 flex items-center justify-center shrink-0"
                      style={{ borderColor: checked ? 'var(--color-sage)' : 'var(--color-warm-gray-light)', background: checked ? 'var(--color-sage)' : 'transparent' }}>
                      {checked && <span style={{ color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>✓</span>}
                    </div>
                    <span className="text-sm leading-relaxed" style={{ color: 'var(--color-charcoal)', textDecoration: checked ? 'line-through' : 'none' }}>
                      {ing.weight_grams ? (
                        <>
                          {(() => { const g = Math.round(ing.weight_grams * scale); return <strong>{g} {pluralizeUnit('gram', g, 1)} </strong>; })()}
                          {(ing.quantity !== null || ing.unit) && (
                            <span style={{ color: 'var(--color-warm-gray)', fontSize: '0.9em' }}>
                              ({ing.quantity !== null ? `${formatQuantity(ing.quantity, scale)}${ing.quantity_max ? `–${formatQuantity(ing.quantity_max, scale)}` : ''} ` : ''}{pluralizeUnit(ing.unit, ing.quantity, scale) ?? ''}){' '}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {ing.quantity !== null && (
                            <strong>{formatQuantity(ing.quantity, scale)}{ing.quantity_max ? `–${formatQuantity(ing.quantity_max, scale)}` : ''} </strong>
                          )}
                          {ing.unit && <span>{pluralizeUnit(ing.unit, ing.quantity, scale)} </span>}
                        </>
                      )}
                      {ing.ingredient_name ?? ing.raw_text}
                      {ing.preparation_notes && <em style={{ color: 'var(--color-warm-gray)' }}>, {ing.preparation_notes}</em>}
                      {ing.is_optional && <span style={{ color: 'var(--color-warm-gray)' }}> (optional)</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
