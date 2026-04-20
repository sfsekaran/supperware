import { useState, useCallback } from 'react';

function loadSet(key: string): Set<number> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<number>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch { /* quota exceeded — ignore */ }
}

export function useRecipeProgress(recipeId: string | undefined) {
  const ingKey  = `recipe_${recipeId}_ingredients`;
  const stepKey = `recipe_${recipeId}_steps`;

  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    () => loadSet(ingKey),
  );
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(
    () => loadSet(stepKey),
  );

  const toggleIngredient = useCallback((id: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      saveSet(ingKey, next);
      return next;
    });
  }, [ingKey]);

  const toggleStep = useCallback((id: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      saveSet(stepKey, next);
      return next;
    });
  }, [stepKey]);

  const clearProgress = useCallback(() => {
    setCheckedIngredients(new Set());
    setCheckedSteps(new Set());
    try { localStorage.removeItem(ingKey); localStorage.removeItem(stepKey); } catch { /* ignore */ }
  }, [ingKey, stepKey]);

  return { checkedIngredients, checkedSteps, toggleIngredient, toggleStep, clearProgress };
}
