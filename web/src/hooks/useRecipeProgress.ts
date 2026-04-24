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

function loadScale(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    return raw ? Math.max(0.25, parseFloat(raw)) : 1;
  } catch {
    return 1;
  }
}

export function useRecipeProgress(recipeId: string | undefined) {
  const ingKey   = `recipe_${recipeId}_ingredients`;
  const stepKey  = `recipe_${recipeId}_steps`;
  const scaleKey = `recipe_${recipeId}_scale`;

  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    () => loadSet(ingKey),
  );
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(
    () => loadSet(stepKey),
  );
  const [scale, setScaleState] = useState<number>(() => loadScale(scaleKey));

  const setScale = useCallback((value: number) => {
    setScaleState(value);
    try { localStorage.setItem(scaleKey, String(value)); } catch { /* ignore */ }
  }, [scaleKey]);

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
    setScaleState(1);
    try {
      localStorage.removeItem(ingKey);
      localStorage.removeItem(stepKey);
      localStorage.removeItem(scaleKey);
    } catch { /* ignore */ }
  }, [ingKey, stepKey, scaleKey]);

  return { checkedIngredients, checkedSteps, toggleIngredient, toggleStep, clearProgress, scale, setScale };
}
