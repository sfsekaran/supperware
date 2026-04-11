import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Users, ArrowLeft, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { useWakeLock } from '../../hooks/useWakeLock';
import { WakeLockToggle } from '../../components/WakeLockToggle';

interface PublicRecipe {
  id: number; title: string; description: string | null;
  primary_image_url: string | null; source_url: string | null; source_host: string | null;
  prep_time_minutes: number | null; cook_time_minutes: number | null; total_time_minutes: number | null;
  yield_quantity: number | null; yield_unit: string | null; cuisine: string | null;
  diet_tags: string[];
  ingredients: { id: number; position: number; group_name: string | null; raw_text: string; quantity: number | null; quantity_max: number | null; unit: string | null; ingredient_name: string | null; preparation_notes: string | null; is_optional: boolean }[];
  steps: { id: number; position: number; section_name: string | null; instruction: string }[];
}

function formatQty(qty: number | null, scale: number) {
  if (qty === null) return '';
  const val = qty * scale;
  return val === Math.floor(val) ? String(val) : val.toFixed(1);
}

export default function PublicRecipePage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const [scale, setScale] = useState(1);
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
          <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full" style={{ background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)' }}>
            <Users size={13} /> {recipe.yield_quantity} {recipe.yield_unit ?? 'servings'}
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

      {/* Serving scaler */}
      {recipe.yield_quantity && (
        <div className="flex items-center gap-4 p-4 rounded-xl mb-8" style={{ background: 'var(--color-cream-dark)', border: '1px solid var(--color-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>
            Serves {Math.round(recipe.yield_quantity * scale)} {recipe.yield_unit ?? ''}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setScale((s) => Math.max(0.25, +(s - 0.25).toFixed(2)))}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
              style={{ background: 'var(--color-terra)', color: 'white', border: 'none', cursor: 'pointer' }}>−</button>
            <span className="text-sm w-10 text-center" style={{ color: 'var(--color-charcoal)' }}>{scale}×</span>
            <button onClick={() => setScale((s) => +(s + 0.25).toFixed(2))}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
              style={{ background: 'var(--color-terra)', color: 'white', border: 'none', cursor: 'pointer' }}>+</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Ingredients */}
        <div className="md:col-span-2">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '1rem' }}>
            Ingredients
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="space-y-2">
            {recipe.ingredients.map((ing: PublicRecipe['ingredients'][number]) => (
              <li key={ing.id} className="text-sm leading-relaxed" style={{ color: 'var(--color-charcoal)' }}>
                {ing.quantity !== null && <strong>{formatQty(ing.quantity, scale)}{ing.quantity_max ? `–${formatQty(ing.quantity_max, scale)}` : ''} </strong>}
                {ing.unit && <span>{ing.unit} </span>}
                {ing.ingredient_name ?? ing.raw_text}
                {ing.preparation_notes && <em style={{ color: 'var(--color-warm-gray)' }}>, {ing.preparation_notes}</em>}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="md:col-span-3">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '1rem' }}>
            Instructions
          </h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }} className="space-y-4">
            {recipe.steps.map((step: PublicRecipe['steps'][number], i: number) => (
              <li key={step.id} className="flex items-start gap-4">
                <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ background: 'var(--color-cream-dark)', color: 'var(--color-warm-gray)' }}>
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed pt-0.5" style={{ color: 'var(--color-charcoal)', margin: 0 }}>
                  {step.instruction}
                </p>
              </li>
            ))}
          </ol>
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
