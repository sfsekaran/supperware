import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, ArrowLeft, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { type Ingredient, type Step } from '../../lib/recipeUtils';
import { useWakeLock } from '../../hooks/useWakeLock';
import { WakeLockToggle } from '../../components/WakeLockToggle';
import { IngredientList } from '../../components/IngredientList';
import { StepList } from '../../components/StepList';
import { ServingScaler } from '../../components/ServingScaler';

interface PublicRecipe {
  id: number; title: string; description: string | null;
  primary_image_url: string | null; source_url: string | null; source_host: string | null;
  prep_time_minutes: number | null; cook_time_minutes: number | null; total_time_minutes: number | null;
  yield_quantity: number | null; yield_unit: string | null; cuisine: string | null;
  diet_tags: string[];
  ingredients: Ingredient[];
  steps: Step[];
}

export default function PublicRecipePage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const [scale, setScale] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const wakeLockSupported = 'wakeLock' in navigator;
  useWakeLock(wakeLockEnabled);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['public_recipe', username, slug],
    queryFn: async () => {
      const { data } = await api.get<PublicRecipe>(`/api/v1/public/users/${username}/recipes/${slug}`);
      return data;
    },
  });

  const toggleIngredient = (id: number) =>
    setCheckedIngredients((s) => { const n = new Set(s); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });

  const toggleStep = (id: number) =>
    setCheckedSteps((s) => { const n = new Set(s); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });

  if (isLoading) return <div className="p-8 text-sm" style={{ color: 'var(--color-warm-gray)' }}>Loading…</div>;
  if (!recipe) return <div className="p-8 text-sm" style={{ color: '#b91c1c' }}>Recipe not found.</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 pb-24">
      <Link to={`/u/${username}`} className="flex items-center gap-2 text-sm mb-6 no-underline hover:underline" style={{ color: 'var(--color-warm-gray)' }}>
        <ArrowLeft size={14} /> Back to @{username}'s recipes
      </Link>

      {recipe.primary_image_url && (
        <img src={recipe.primary_image_url} alt={recipe.title} className="w-full object-cover rounded-2xl mb-6" style={{ maxHeight: 320 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 600, lineHeight: 1.2, color: 'var(--color-charcoal)', marginBottom: '0.75rem' }}>
        {recipe.title}
      </h1>

      {recipe.description && (
        <p className="text-base mb-5 leading-relaxed" style={{ color: 'var(--color-warm-gray)' }}>{recipe.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {recipe.total_time_minutes && (
          <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full" style={{ background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)' }}>
            <Clock size={13} /> {recipe.total_time_minutes} min
          </span>
        )}
        {recipe.yield_quantity && (
          <span className="text-sm px-3 py-1.5 rounded-full" style={{ background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)' }}>
            {recipe.yield_quantity} {recipe.yield_unit ?? 'servings'}
          </span>
        )}
        {recipe.cuisine && (
          <span className="text-sm px-3 py-1.5 rounded-full" style={{ background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)' }}>{recipe.cuisine}</span>
        )}
        {recipe.source_url && (
          <a href={recipe.source_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs no-underline hover:underline" style={{ color: 'var(--color-warm-gray)' }}>
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

      {/* Save CTA */}
      <div className="mt-12 p-6 rounded-2xl text-center" style={{ background: 'var(--color-sage)', color: 'white' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
          Want to save this recipe?
        </p>
        <p className="text-sm opacity-80 mb-4">Create a free Supperware account to keep it in your collection.</p>
        <Link to="/signup" className="inline-block px-6 py-2.5 rounded-xl font-semibold text-sm no-underline"
          style={{ background: 'white', color: 'var(--color-sage)' }}>
          Get started free
        </Link>
      </div>
    </div>
  );
}
