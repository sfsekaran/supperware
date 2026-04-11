import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Users, ArrowLeft, ExternalLink, Trash2, Globe, Lock, Pencil } from 'lucide-react';
import { api } from '../lib/api';
import { useWakeLock, wakeLockSupported } from '../hooks/useWakeLock';
import { WakeLockToggle } from '../components/WakeLockToggle';
import { useAuthStore } from '../stores/authStore';
import type { AuthState } from '../stores/authStore';

interface Ingredient {
  id: number; position: number; group_name: string | null;
  raw_text: string; quantity: number | null; quantity_max: number | null;
  unit: string | null; weight_grams: number | null; ingredient_name: string | null;
  preparation_notes: string | null; is_optional: boolean;
  parse_confidence: number | null;
}
interface Step {
  id: number; position: number; section_name: string | null;
  instruction: string; duration_minutes: number | null;
}
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

function formatQuantity(qty: number | null, scale: number): string {
  if (qty === null) return '';
  const val = qty * scale;
  if (val === Math.floor(val)) return String(val);
  return val.toFixed(1).replace(/\.0$/, '');
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
    setCheckedIngredients((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleStep = (id: number) =>
    setCheckedSteps((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

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

  const yieldBase = recipe.yield_quantity ?? 4;
  const yieldScaled = yieldBase * scale;

  // Group ingredients by section
  const ingredientGroups: { name: string | null; items: Ingredient[] }[] = [];
  for (const ing of recipe.ingredients) {
    const last = ingredientGroups[ingredientGroups.length - 1];
    if (!last || last.name !== ing.group_name) {
      ingredientGroups.push({ name: ing.group_name, items: [ing] });
    } else {
      last.items.push(ing);
    }
  }

  const stepGroups: { name: string | null; items: Step[] }[] = [];
  for (const step of recipe.steps) {
    const last = stepGroups[stepGroups.length - 1];
    if (!last || last.name !== step.section_name) {
      stepGroups.push({ name: step.section_name, items: [step] });
    } else {
      last.items.push(step);
    }
  }

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
          {recipe && (
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
          )}

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
        <div className="mb-8">
          <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--color-cream-dark)', border: '1px solid var(--color-border)' }}>
            <Users size={16} style={{ color: 'var(--color-warm-gray)', flexShrink: 0 }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>
              Serves {Math.round(yieldScaled)} {recipe.yield_unit ?? ''}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => setScale((s) => Math.max(0.25, +(s - 0.25).toFixed(2)))}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
                style={{ background: 'var(--color-terra)', color: 'white', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
                −
              </button>
              <span className="text-sm font-medium w-12 text-center" style={{ color: 'var(--color-charcoal)' }}>
                {scale === 1 ? '1×' : `${scale}×`}
              </span>
              <button onClick={() => setScale((s) => +(s + 0.25).toFixed(2))}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg"
                style={{ background: 'var(--color-terra)', color: 'white', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
                +
              </button>
            </div>
          </div>
          {recipe.yield_description && (
            <p className="text-xs mt-2 pl-1" style={{ color: 'var(--color-warm-gray)' }}>
              Makes {recipe.yield_description}
            </p>
          )}
        </div>
      )}

      {/* Two-column layout for wide screens */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Ingredients */}
        <div className="md:col-span-2">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '1rem' }}>
            Ingredients
          </h2>
          {ingredientGroups.map((group, gi) => (
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
                        onClick={() => toggleIngredient(ing.id)}
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
                              <strong>{Math.round(ing.weight_grams * scale)}g </strong>
                              {(ing.quantity !== null || ing.unit) && (
                                <span style={{ color: 'var(--color-warm-gray)', fontSize: '0.9em' }}>
                                  ({ing.quantity !== null ? `${formatQuantity(ing.quantity, scale)}${ing.quantity_max ? `–${formatQuantity(ing.quantity_max, scale)}` : ''} ` : ''}{ing.unit ?? ''}){' '}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {ing.quantity !== null && (
                                <strong>{formatQuantity(ing.quantity, scale)}{ing.quantity_max ? `–${formatQuantity(ing.quantity_max, scale)}` : ''} </strong>
                              )}
                              {ing.unit && <span>{ing.unit} </span>}
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
        </div>

        {/* Steps */}
        <div className="md:col-span-3">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '1rem' }}>
            Instructions
          </h2>
          {stepGroups.map((group, gi) => (
            <div key={gi} className="mb-6">
              {group.name && (
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-warm-gray)' }}>
                  {group.name}
                </p>
              )}
              <div className="space-y-3">
                {group.items.map((step) => {
                  const checked = checkedSteps.has(step.id);
                  const globalIdx = recipe.steps.indexOf(step) + 1;
                  return (
                    <button
                      key={step.id}
                      onClick={() => toggleStep(step.id)}
                      className="flex items-start gap-4 text-left w-full p-4 rounded-xl transition-all"
                      style={{
                        background: checked ? '#e8f0e5' : 'white',
                        border: `1.5px solid ${checked ? 'var(--color-sage-light)' : 'var(--color-border)'}`,
                        cursor: 'pointer',
                        opacity: checked ? 0.6 : 1,
                      }}
                    >
                      <span
                        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold"
                        style={{ background: checked ? 'var(--color-sage)' : 'var(--color-cream-dark)', color: checked ? 'white' : 'var(--color-warm-gray)' }}>
                        {checked ? '✓' : globalIdx}
                      </span>
                      <p className="text-sm leading-relaxed pt-0.5" style={{ color: 'var(--color-charcoal)', textDecoration: checked ? 'line-through' : 'none', margin: 0 }}>
                        {step.instruction}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
