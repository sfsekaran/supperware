import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { api } from '../lib/api';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Recipe {
  id: number; title: string; description: string | null;
  cuisine: string | null; category: string | null;
  prep_time_minutes: number | null; cook_time_minutes: number | null; total_time_minutes: number | null;
  yield_quantity: number | null; yield_unit: string | null; yield_description: string | null;
  primary_image_url: string | null; source_url: string | null;
  visibility: 'private' | 'unlisted' | 'public';
  personal_notes: string | null;
}

interface Ingredient {
  id: number; position: number; group_name: string | null;
  raw_text: string; quantity: number | null; quantity_max: number | null;
  unit: string | null; ingredient_name: string | null;
  preparation_notes: string | null; is_optional: boolean;
}

interface Step {
  id: number; position: number; section_name: string | null; instruction: string;
}

// Local editable row types (use clientId for new rows not yet saved)
interface EditIngredient { clientId: string; id?: number; raw_text: string; group_name: string; }
interface EditStep       { clientId: string; id?: number; instruction: string; section_name: string; }

let _uid = 0;
const uid = () => String(++_uid);

const field = (label: string, children: React.ReactNode, hint?: string) => (
  <div className="mb-5">
    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>{label}</label>
    {children}
    {hint && <p className="text-xs mt-1" style={{ color: 'var(--color-warm-gray)' }}>{hint}</p>}
  </div>
);

const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors";
const inputStyle = { border: '1px solid var(--color-border)', background: 'white', color: 'var(--color-charcoal)', fontFamily: 'inherit' };
const inputFocusStyle = { borderColor: 'var(--color-sage)' };

function Input({ value, onChange, type = 'text', placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input type={type} className={inputCls} style={inputStyle}
      value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
      onBlur={e => Object.assign(e.target.style, { borderColor: 'var(--color-border)' })} />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea className={inputCls} style={{ ...inputStyle, resize: 'vertical' }} rows={rows}
      value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
      onBlur={e => Object.assign(e.target.style, { borderColor: 'var(--color-border)' })} />
  );
}

function DragHandle(props: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props}
      className="shrink-0 flex items-center justify-center rounded"
      style={{ width: 24, height: 28, marginTop: 2, background: 'none', border: 'none', cursor: 'grab', color: 'var(--color-warm-gray)', touchAction: 'none' }}>
      <GripVertical size={14} />
    </button>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} type="button"
      className="shrink-0 flex items-center justify-center rounded"
      style={{ width: 28, height: 28, marginTop: 2, background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c' }}>
      <Trash2 size={14} />
    </button>
  );
}

function SortableIngredientRow({ ing, onChange, onDelete }: {
  ing: EditIngredient;
  onChange: (patch: Partial<EditIngredient>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ing.clientId });
  return (
    <div ref={setNodeRef}
      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem',
        transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
      <DragHandle {...attributes} {...listeners} />
      <div className="flex-1 flex flex-col gap-1.5">
        <input className={inputCls} style={inputStyle}
          value={ing.raw_text} placeholder="e.g. 2 cups flour"
          onChange={e => onChange({ raw_text: e.target.value })}
          onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={e => Object.assign(e.target.style, { borderColor: 'var(--color-border)' })} />
        <input className={inputCls} style={{ ...inputStyle, fontSize: '0.75rem', padding: '4px 10px' }}
          value={ing.group_name} placeholder="Group / section (optional)"
          onChange={e => onChange({ group_name: e.target.value })}
          onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={e => Object.assign(e.target.style, { borderColor: 'var(--color-border)' })} />
      </div>
      <DeleteBtn onClick={onDelete} />
    </div>
  );
}

function SortableStepRow({ step, index, onChange, onDelete }: {
  step: EditStep;
  index: number;
  onChange: (patch: Partial<EditStep>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.clientId });
  return (
    <div ref={setNodeRef}
      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem',
        transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
      <DragHandle {...attributes} {...listeners} />
      <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mt-1.5"
        style={{ background: 'var(--color-cream-dark)', color: 'var(--color-warm-gray)', minWidth: '1.5rem' }}>
        {index + 1}
      </span>
      <div className="flex-1 flex flex-col gap-1.5">
        <textarea className={inputCls} style={{ ...inputStyle, resize: 'vertical' }} rows={3}
          value={step.instruction} placeholder="Describe this step…"
          onChange={e => onChange({ instruction: e.target.value })}
          onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={e => Object.assign(e.target.style, { borderColor: 'var(--color-border)' })} />
        <input className={inputCls} style={{ ...inputStyle, fontSize: '0.75rem', padding: '4px 10px' }}
          value={step.section_name} placeholder="Section name (optional)"
          onChange={e => onChange({ section_name: e.target.value })}
          onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
          onBlur={e => Object.assign(e.target.style, { borderColor: 'var(--color-border)' })} />
      </div>
      <DeleteBtn onClick={onDelete} />
    </div>
  );
}

// Inner form — rendered only after all data is loaded, so state can be
// initialized directly from props without useEffect.
function RecipeEditForm({ id, recipe, ingredientsData, stepsData }: {
  id: string;
  recipe: Recipe;
  ingredientsData: Ingredient[];
  stepsData: Step[];
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle]             = useState(recipe.title ?? '');
  const [description, setDescription] = useState(recipe.description ?? '');
  const [cuisine, setCuisine]         = useState(recipe.cuisine ?? '');
  const [category, setCategory]       = useState(recipe.category ?? '');
  const [prepTime, setPrepTime]       = useState(recipe.prep_time_minutes?.toString() ?? '');
  const [cookTime, setCookTime]       = useState(recipe.cook_time_minutes?.toString() ?? '');
  const [totalTime, setTotalTime]     = useState(recipe.total_time_minutes?.toString() ?? '');
  const [yieldQty, setYieldQty]       = useState(recipe.yield_quantity?.toString() ?? '');
  const [yieldUnit, setYieldUnit]     = useState(recipe.yield_unit ?? '');
  const [imageUrl, setImageUrl]       = useState(recipe.primary_image_url ?? '');
  const [sourceUrl, setSourceUrl]     = useState(recipe.source_url ?? '');
  const [visibility, setVisibility]   = useState<'private' | 'unlisted' | 'public'>(recipe.visibility ?? 'private');
  const [notes, setNotes]             = useState(recipe.personal_notes ?? '');

  const [ingredients, setIngredients] = useState<EditIngredient[]>(() =>
    ingredientsData.map(i => ({ clientId: uid(), id: i.id, raw_text: i.raw_text, group_name: i.group_name ?? '' }))
  );
  const [steps, setSteps] = useState<EditStep[]>(() =>
    stepsData.map(s => ({ clientId: uid(), id: s.id, instruction: s.instruction, section_name: s.section_name ?? '' }))
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const ops: Promise<unknown>[] = [];

      ops.push(api.patch(`/api/v1/recipes/${id}`, {
        recipe: {
          title,
          description:        description || null,
          cuisine:            cuisine || null,
          category:           category || null,
          prep_time_minutes:  prepTime  ? parseInt(prepTime)   : null,
          cook_time_minutes:  cookTime  ? parseInt(cookTime)   : null,
          total_time_minutes: totalTime ? parseInt(totalTime)  : null,
          yield_quantity:     yieldQty  ? parseFloat(yieldQty) : null,
          yield_unit:         yieldUnit || null,
          primary_image_url:  imageUrl  || null,
          source_url:         sourceUrl || null,
          visibility,
          personal_notes:     notes || null,
        },
      }));

      ingredients.forEach((ing, idx) => {
        const body = { ingredient: { raw_text: ing.raw_text, group_name: ing.group_name || null, position: idx + 1 } };
        if (ing.id) {
          ops.push(api.patch(`/api/v1/recipes/${id}/ingredients/${ing.id}`, body));
        } else {
          ops.push(api.post(`/api/v1/recipes/${id}/ingredients`, body));
        }
      });

      steps.forEach((step, idx) => {
        const body = { step: { instruction: step.instruction, section_name: step.section_name || null, position: idx + 1 } };
        if (step.id) {
          ops.push(api.patch(`/api/v1/recipes/${id}/steps/${step.id}`, body));
        } else {
          ops.push(api.post(`/api/v1/recipes/${id}/steps`, body));
        }
      });

      await Promise.all(ops);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe_ingredients', id] });
      queryClient.invalidateQueries({ queryKey: ['recipe_steps', id] });
      navigate(`/recipes/${id}`);
    },
  });

  const deleteIngredient = async (ing: EditIngredient) => {
    if (ing.id) await api.delete(`/api/v1/recipes/${id}/ingredients/${ing.id}`);
    setIngredients(prev => prev.filter(i => i.clientId !== ing.clientId));
  };

  const deleteStep = async (step: EditStep) => {
    if (step.id) await api.delete(`/api/v1/recipes/${id}/steps/${step.id}`);
    setSteps(prev => prev.filter(s => s.clientId !== step.clientId));
  };

  const addIngredient = () =>
    setIngredients(prev => [...prev, { clientId: uid(), raw_text: '', group_name: '' }]);

  const addStep = () =>
    setSteps(prev => [...prev, { clientId: uid(), instruction: '', section_name: '' }]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onIngredientDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setIngredients(prev => arrayMove(prev, prev.findIndex(i => i.clientId === active.id), prev.findIndex(i => i.clientId === over.id)));
    }
  };

  const onStepDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setSteps(prev => arrayMove(prev, prev.findIndex(s => s.clientId === active.id), prev.findIndex(s => s.clientId === over.id)));
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(`/recipes/${id}`)}
          className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-warm-gray)', padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !title.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
          style={{ background: 'var(--color-terra)', color: 'white', border: 'none', cursor: 'pointer',
            opacity: saveMutation.isPending || !title.trim() ? 0.6 : 1 }}>
          <Save size={15} />
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600,
        color: 'var(--color-charcoal)', marginBottom: '1.5rem' }}>
        Edit Recipe
      </h1>

      {saveMutation.isError && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fee2e2', color: '#b91c1c' }}>
          {(saveMutation.error as Error).message}
        </div>
      )}

      {field('Title', <Input value={title} onChange={setTitle} placeholder="Recipe title" />)}
      {field('Description', <Textarea value={description} onChange={setDescription} placeholder="Brief description" rows={3} />)}

      <div className="grid grid-cols-2 gap-4">
        {field('Cuisine', <Input value={cuisine} onChange={setCuisine} placeholder="e.g. Italian" />)}
        {field('Category', <Input value={category} onChange={setCategory} placeholder="e.g. Bread" />)}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {field('Prep time (min)', <Input type="number" value={prepTime} onChange={setPrepTime} placeholder="0" />)}
        {field('Cook time (min)', <Input type="number" value={cookTime} onChange={setCookTime} placeholder="0" />)}
        {field('Total time (min)', <Input type="number" value={totalTime} onChange={setTotalTime} placeholder="0" />)}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {field('Servings', <Input type="number" value={yieldQty} onChange={setYieldQty} placeholder="4" />)}
        {field('Unit', <Input value={yieldUnit} onChange={setYieldUnit} placeholder="servings" />)}
      </div>

      {field('Visibility',
        <select className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}
          value={visibility} onChange={e => setVisibility(e.target.value as typeof visibility)}>
          <option value="private">Private</option>
          <option value="unlisted">Unlisted</option>
          <option value="public">Public</option>
        </select>
      )}

      {field('Image URL', <Input value={imageUrl} onChange={setImageUrl} placeholder="https://…" />, 'Paste a direct image URL')}
      {field('Source URL', <Input value={sourceUrl} onChange={setSourceUrl} placeholder="https://…" />, 'Original recipe page')}
      {field('Personal notes', <Textarea value={notes} onChange={setNotes} placeholder="Your notes, tweaks, tips…" rows={4} />)}

      {/* ── Ingredients ── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
            Ingredients
          </h2>
          <button onClick={addIngredient} type="button"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
            style={{ background: 'var(--color-cream-dark)', border: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-charcoal)' }}>
            <Plus size={12} /> Add
          </button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onIngredientDragEnd}>
          <SortableContext items={ingredients.map(i => i.clientId)} strategy={verticalListSortingStrategy}>
            {ingredients.map((ing) => (
              <SortableIngredientRow key={ing.clientId} ing={ing}
                onChange={patch => setIngredients(prev => prev.map(i => i.clientId === ing.clientId ? { ...i, ...patch } : i))}
                onDelete={() => deleteIngredient(ing)} />
            ))}
          </SortableContext>
        </DndContext>
        {ingredients.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-warm-gray)' }}>No ingredients yet. Add one above.</p>
        )}
      </div>

      {/* ── Steps ── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
            Instructions
          </h2>
          <button onClick={addStep} type="button"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
            style={{ background: 'var(--color-cream-dark)', border: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-charcoal)' }}>
            <Plus size={12} /> Add
          </button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onStepDragEnd}>
          <SortableContext items={steps.map(s => s.clientId)} strategy={verticalListSortingStrategy}>
            {steps.map((step, idx) => (
              <SortableStepRow key={step.clientId} step={step} index={idx}
                onChange={patch => setSteps(prev => prev.map(s => s.clientId === step.clientId ? { ...s, ...patch } : s))}
                onDelete={() => deleteStep(step)} />
            ))}
          </SortableContext>
        </DndContext>
        {steps.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-warm-gray)' }}>No steps yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}

export default function RecipeEditPage() {
  const { id } = useParams<{ id: string }>();

  const { data: recipe, isLoading: recipeLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const { data } = await api.get<Recipe>(`/api/v1/recipes/${id}`);
      return data;
    },
  });

  const { data: ingredientsData, isLoading: ingredientsLoading } = useQuery({
    queryKey: ['recipe_ingredients', id],
    queryFn: async () => {
      const { data } = await api.get<Ingredient[]>(`/api/v1/recipes/${id}/ingredients`);
      return data;
    },
  });

  const { data: stepsData, isLoading: stepsLoading } = useQuery({
    queryKey: ['recipe_steps', id],
    queryFn: async () => {
      const { data } = await api.get<Step[]>(`/api/v1/recipes/${id}/steps`);
      return data;
    },
  });

  if (recipeLoading || ingredientsLoading || stepsLoading) return (
    <div className="p-8 text-center" style={{ color: 'var(--color-warm-gray)' }}>Loading…</div>
  );

  if (!recipe || !ingredientsData || !stepsData) return (
    <div className="p-8 text-sm" style={{ color: '#b91c1c' }}>Could not load recipe.</div>
  );

  return <RecipeEditForm id={id!} recipe={recipe} ingredientsData={ingredientsData} stepsData={stepsData} />;
}
