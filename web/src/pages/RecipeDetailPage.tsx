import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Globe, Lock, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { type Ingredient, type Step } from '../lib/recipeUtils';
import { RecipeView } from '../components/RecipeView';
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const { data } = await api.get<Recipe>(`/api/v1/recipes/${id}`);
      return data;
    },
    refetchOnWindowFocus: false,
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

  const visibilityChip = (
    <>
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
    </>
  );

  const personalNotes = recipe.personal_notes ? (
    <div className="p-5 rounded-xl" style={{ background: 'var(--color-cream-dark)', border: '1px solid var(--color-border)' }}>
      <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-charcoal)' }}>My notes</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-warm-gray)' }}>{recipe.personal_notes}</p>
    </div>
  ) : null;

  return (
    <div className="max-w-3xl mx-auto p-6 pb-24">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-warm-gray)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <ArrowLeft size={15} /> Back to recipes
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/recipes/${id}/edit`)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
            style={{ background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
            <Pencil size={12} /> Edit
          </button>

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

      <RecipeView
        recipe={recipe}
        progressKey={id!}
        extraChips={visibilityChip}
        footer={personalNotes}
      />
    </div>
  );
}
