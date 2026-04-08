import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Clock, Search, Heart } from 'lucide-react';
import { api } from '../lib/api';

interface Recipe {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  cuisine: string | null;
  category: string | null;
  diet_tags: string[];
  total_time_minutes: number | null;
  primary_image_url: string | null;
  is_favorite: boolean;
  source_host: string | null;
  parse_confidence: number | null;
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/recipes/${recipe.id}`)}
      className="text-left rounded-2xl overflow-hidden transition-shadow hover:shadow-md"
      style={{ background: 'white', border: '1px solid var(--color-border)', cursor: 'pointer', padding: 0 }}
    >
      {recipe.primary_image_url ? (
        <img src={recipe.primary_image_url} alt={recipe.title} className="w-full object-cover" style={{ height: 160 }} />
      ) : (
        <div className="w-full flex items-center justify-center" style={{ height: 160, background: 'var(--color-cream-dark)' }}>
          <span style={{ fontSize: '2.5rem' }}>🍽</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-medium mb-1 line-clamp-2" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--color-charcoal)', lineHeight: 1.4 }}>
          {recipe.title}
        </h3>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {recipe.total_time_minutes && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-warm-gray)' }}>
              <Clock size={11} /> {recipe.total_time_minutes}m
            </span>
          )}
          {recipe.cuisine && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-cream-dark)', color: 'var(--color-warm-gray)' }}>
              {recipe.cuisine}
            </span>
          )}
          {recipe.is_favorite && <Heart size={13} fill="currentColor" style={{ color: 'var(--color-terra)' }} />}
        </div>
        {recipe.source_host && (
          <p className="text-xs mt-2 truncate" style={{ color: 'var(--color-warm-gray-light)' }}>{recipe.source_host}</p>
        )}
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const [search, setSearch] = useState('');

  const { data: recipes, isLoading, error } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data } = await api.get<Recipe[]>('/api/v1/recipes');
      return data;
    },
  });

  const filtered = recipes?.filter((r) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-charcoal)', margin: 0 }}>
            My Recipes
          </h1>
          {recipes && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-warm-gray)' }}>
              {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
            </p>
          )}
        </div>
        <Link
          to="/recipes/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold no-underline"
          style={{ background: 'var(--color-terra)', color: 'white' }}
        >
          <PlusCircle size={16} /> Add Recipe
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-warm-gray)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ border: '1.5px solid var(--color-border)', background: 'white', color: 'var(--color-charcoal)' }}
        />
      </div>

      {/* States */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'var(--color-cream-dark)', height: 240 }} />
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm px-4 py-3 rounded-lg" style={{ background: '#fef2f2', color: '#b91c1c' }}>
          Could not load recipes. Make sure the API is running.
        </div>
      )}

      {!isLoading && filtered?.length === 0 && (
        <div className="text-center py-24">
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍳</p>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-charcoal)', fontWeight: 500, marginBottom: '0.5rem' }}>
            {search ? 'No results' : 'No recipes yet'}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-warm-gray)' }}>
            {search ? 'Try a different search term' : 'Add your first recipe to get started'}
          </p>
          {!search && (
            <Link to="/recipes/new" className="px-6 py-2.5 rounded-xl text-sm font-semibold no-underline" style={{ background: 'var(--color-terra)', color: 'white' }}>
              Add your first recipe
            </Link>
          )}
        </div>
      )}

      {!isLoading && filtered && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  );
}
