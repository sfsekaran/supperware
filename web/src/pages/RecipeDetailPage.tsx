import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, ArrowLeft, ExternalLink, Trash2, Globe, Lock, Pencil } from 'lucide-react';
import { api } from '../lib/api';
import { type Ingredient, type Step } from '../lib/recipeUtils';
import { useWakeLock, wakeLockSupported } from '../hooks/useWakeLock';
import { WakeLockToggle } from '../components/WakeLockToggle';
import { IngredientList } from '../components/IngredientList';
import { StepList } from '../components/StepList';
import { ServingScaler } from '../components/ServingScaler';
import { useAuthStore } from '../stores/authStore';
import type { AuthState } from '../stores/authStore';

interface Recipe {
  id: number; title: string; description: string | null;
  slug: string; source_url: string | null; source_host: string | null;
  primary_image_url: string | null;
  prep_time_minutes: number | null; cook_time_minutes: number | null; total_time_minutes: number | null;
  yield_quantity: number | null; yield_unit: string | null; yield_raw: string | null; yield_description: string | null;
  cuisine: string | null; diet_tags: string[]; is_favorite: boolean;
  visibility: 'private' | 'unlisted' | 'public';
  personal_notes: string | null; nutrition: Record<string, string> | null;
  ingredients: Ingredient[]; steps: Step[];
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const username = useAuthStore((s: AuthState) => s.user?.username);
  const [scale, setScale] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();

  useWakeLock(wakeLockEnabled);

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const { data } = await api.get<Recipe>(`/api/v1/recipes/${id}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/v1/recipes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate('/dashboard');
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: (visibility: string) =>
      api.patch(`/api/v1/recipes/${id}`, { recipe: { visibility } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const toggleIngredient = (id: number) =>
    setCheckedIngredients((s) => { const n = new Set(s); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });

  const toggleStep = (id: number) =>
    setCheckedSteps((s) => { const n = new Set(s); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });

  if (isLoading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 rounded-xl" style={{ background: 'var(--color-cream-dark)' }} />
        <div className="h-48 rounded-2xl" style={{ background: 'var(--color-cream-dark)' }} />
      </div>
    </div>
  );

  if (error || !recipe) return (
    <div className="p-8 text-sm" style={{ color: '#b91c1c' }}>Could not load recipe.</div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 pb-24">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-warm-gray)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={15} /> Back to recipes
        </button>

        <div className="flex items-center gap-2">
          {/* Edit */}
          <button
            onClick={() => navigate(`/recipes/${id}/edit`)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
            style={{ background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
            <Pencil size={12} /> Edit
          </button>

          {/* Publish / unpublish */}
          <button
            onClick={() => visibilityMutation.mutate(recipe.visibility === 'public' ? 'private' : 'public')}
            disabled={visibilityMutation.isPending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
            style={{
              background: recipe.visibility === 'public' ? '#e8f0e5' : 'var(--color-cream-dark)',
              color: recipe.visibility === 'public' ? 'var(--color-sage)' : 'var(--color-warm-gray)',
              border: '1px solid',
              borderColor: recipe.visibility === 'public' ? 'var(--color-sage-light)' : 'var(--color-border)',
              cursor: 'pointer',
            }}
          >
            {recipe.visibility === 'public' ? <Globe size={12} /> : <Lock size={12} />}
            {recipe.visibility === 'public' ? 'Public' : 'Private'}
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: 'var(--color-warm-gray)' }}>Delete?</span>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', cursor: 'pointer' }}
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: 'var(--color-cream-dark)', color: 'var(--color-warm-gray)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors hover:opacity-80"
              style={{ background: 'var(--color-cream-dark)', color: 'var(--color-warm-gray)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Hero image */}
      {recipe.primary_image_url && (
        <img src={recipe.primary_image_url} alt={recipe.title}
          className="w-full object-cover rounded-2xl mb-6" style={{ maxHeight: 320 }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}

      {/* Title & meta */}
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 600, lineHeight: 1.2, color: 'var(--color-charcoal)', marginBottom: '0.75rem' }}>
        {recipe.title}
      </h1>

      {recipe.description && (
        <p className="text-base mb-5 leading-relaxed" style={{ color: 'var(--color-warm-gray)' }}>{recipe.description}</p>
      )}

      {/* Chips row */}
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
        {recipe.diet_tags?.map((tag: string) => (
          <span key={tag} className="text-sm px-3 py-1.5 rounded-full" style={{ background: '#e8f0e5', color: 'var(--color-sage)' }}>{tag}</span>
        ))}
        {recipe.source_url && (
          <a href={recipe.source_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs no-underline hover:underline"
            style={{ color: 'var(--color-warm-gray)' }}>
            <ExternalLink size={11} /> {recipe.source_host}
          </a>
        )}
        {recipe.visibility === 'public' && username && (
          <a
            href={`/u/${username}/${recipe.slug}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs no-underline hover:underline"
            style={{ color: 'var(--color-warm-gray)' }}
          >
            <Globe size={11} /> Public page
          </a>
        )}
        {wakeLockSupported && (
          <WakeLockToggle enabled={wakeLockEnabled} onToggle={() => setWakeLockEnabled((v) => !v)} />
        )}
      </div>

      {/* Serving scaler */}
      {recipe.yield_quantity && (
        <ServingScaler
          yieldQuantity={recipe.yield_quantity}
          yieldUnit={recipe.yield_unit}
          scale={scale}
          onScaleChange={setScale}
          yieldDescription={recipe.yield_description}
        />
      )}

      {/* Two-column layout for wide screens */}
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

      {/* Personal notes */}
      {recipe.personal_notes && (
        <div className="mt-8 p-5 rounded-xl" style={{ background: 'var(--color-cream-dark)', border: '1px solid var(--color-border)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-charcoal)' }}>My notes</h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-warm-gray)' }}>{recipe.personal_notes}</p>
        </div>
      )}
    </div>
  );
}
