import { useState } from 'react';
import { Clock, ExternalLink } from 'lucide-react';
import { type Ingredient, type Step } from '../lib/recipeUtils';
import { useWakeLock, wakeLockSupported } from '../hooks/useWakeLock';
import { useRecipeProgress } from '../hooks/useRecipeProgress';
import { WakeLockToggle } from './WakeLockToggle';
import { IngredientList } from './IngredientList';
import { StepList } from './StepList';
import { ServingScaler } from './ServingScaler';

export interface RecipeViewRecipe {
  title: string;
  description: string | null;
  primary_image_url: string | null;
  source_url: string | null;
  source_host: string | null;
  total_time_minutes: number | null;
  yield_quantity: number | null;
  yield_unit: string | null;
  yield_description?: string | null;
  cuisine: string | null;
  diet_tags?: string[];
  ingredients: Ingredient[];
  steps: Step[];
}

interface RecipeViewProps {
  recipe: RecipeViewRecipe;
  progressKey: string;
  extraChips?: React.ReactNode;
  footer?: React.ReactNode;
}

export function RecipeView({ recipe, progressKey, extraChips, footer }: RecipeViewProps) {
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const { checkedIngredients, checkedSteps, toggleIngredient, toggleStep, clearProgress, scale, setScale } =
    useRecipeProgress(progressKey);
  const hasProgress = checkedIngredients.size > 0 || checkedSteps.size > 0;

  useWakeLock(wakeLockEnabled);

  return (
    <>
      <div className="flex justify-end mb-2" style={{ visibility: hasProgress ? 'visible' : 'hidden' }}>
        <button
          onClick={clearProgress}
          className="text-xs px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
          style={{ background: '#e8f0e5', color: 'var(--color-sage)', border: '1px solid var(--color-sage-light)', cursor: 'pointer' }}>
          Clear progress
        </button>
      </div>

      {recipe.primary_image_url && (
        <img src={recipe.primary_image_url} alt={recipe.title}
          className="w-full object-cover rounded-2xl mb-6" style={{ maxHeight: 320 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 600, lineHeight: 1.2, color: 'var(--color-charcoal)', marginBottom: '0.75rem' }}>
        {recipe.title}
      </h1>

      {recipe.description && (
        <p className="text-base mb-5 leading-relaxed" style={{ color: 'var(--color-warm-gray)' }}>
          {recipe.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {recipe.total_time_minutes && (
          <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full" style={{ background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)' }}>
            <Clock size={13} /> {recipe.total_time_minutes} min
          </span>
        )}
        {recipe.cuisine && (
          <span className="text-sm px-3 py-1.5 rounded-full" style={{ background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)' }}>
            {recipe.cuisine}
          </span>
        )}
        {recipe.diet_tags?.map((tag) => (
          <span key={tag} className="text-sm px-3 py-1.5 rounded-full" style={{ background: '#e8f0e5', color: 'var(--color-sage)' }}>
            {tag}
          </span>
        ))}
        {extraChips}
        {recipe.source_url && (
          <a href={recipe.source_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs no-underline hover:underline"
            style={{ color: 'var(--color-warm-gray)' }}>
            <ExternalLink size={11} /> {recipe.source_host}
          </a>
        )}
        {wakeLockSupported && (
          <WakeLockToggle enabled={wakeLockEnabled} onToggle={() => setWakeLockEnabled((v) => !v)} />
        )}
      </div>

      {recipe.yield_quantity && (
        <ServingScaler
          yieldQuantity={recipe.yield_quantity}
          yieldUnit={recipe.yield_unit}
          scale={scale}
          onScaleChange={setScale}
          yieldDescription={recipe.yield_description ?? null}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '1rem' }}>
            Ingredients
          </h2>
          <IngredientList
            ingredients={recipe.ingredients}
            scale={scale}
            checkedIngredients={checkedIngredients}
            onToggle={toggleIngredient}
          />
        </div>

        <div className="md:col-span-3">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '1rem' }}>
            Instructions
          </h2>
          <StepList
            steps={recipe.steps}
            checkedSteps={checkedSteps}
            onToggle={toggleStep}
          />
        </div>
      </div>

      {footer && <div className="mt-8">{footer}</div>}
    </>
  );
}
