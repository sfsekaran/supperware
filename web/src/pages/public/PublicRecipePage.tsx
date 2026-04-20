import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { type Ingredient, type Step } from '../../lib/recipeUtils';
import { RecipeView } from '../../components/RecipeView';

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

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['public_recipe', username, slug],
    queryFn: async () => {
      const { data } = await api.get<PublicRecipe>(`/api/v1/public/users/${username}/recipes/${slug}`);
      return data;
    },
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div className="p-8 text-sm" style={{ color: 'var(--color-warm-gray)' }}>Loading…</div>;
  if (!recipe) return <div className="p-8 text-sm" style={{ color: '#b91c1c' }}>Recipe not found.</div>;

  const saveCta = (
    <div className="p-6 rounded-2xl text-center" style={{ background: 'var(--color-sage)', color: 'white' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
        Want to save this recipe?
      </p>
      <p className="text-sm opacity-80 mb-4">Create a free Supperware account to keep it in your collection.</p>
      <Link to="/signup" className="inline-block px-6 py-2.5 rounded-xl font-semibold text-sm no-underline"
        style={{ background: 'white', color: 'var(--color-sage)' }}>
        Get started free
      </Link>
    </div>
  );

  const yieldChip = recipe.yield_quantity ? (
    <span className="text-sm px-3 py-1.5 rounded-full" style={{ background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)' }}>
      {recipe.yield_quantity} {recipe.yield_unit ?? 'servings'}
    </span>
  ) : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 pb-24">
      <Link to={`/u/${username}`} className="flex items-center gap-2 text-sm mb-6 no-underline hover:underline" style={{ color: 'var(--color-warm-gray)' }}>
        <ArrowLeft size={14} /> Back to @{username}'s recipes
      </Link>

      <RecipeView
        recipe={recipe}
        progressKey={`${username}_${slug}`}
        extraChips={yieldChip}
        footer={saveCta}
      />
    </div>
  );
}
