import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { api } from '../../lib/api';

interface PublicRecipe {
  id: number; title: string; slug: string;
  primary_image_url: string | null; cuisine: string | null;
  total_time_minutes: number | null; description: string | null;
}
interface PublicProfile {
  username: string; display_name: string | null; bio: string | null;
  avatar_url: string | null;
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['public_profile', username],
    queryFn: async () => {
      const { data } = await api.get<PublicProfile>(`/api/v1/public/users/${username}`);
      return data;
    },
  });

  const { data: recipes, isLoading: recipesLoading } = useQuery({
    queryKey: ['public_recipes', username],
    queryFn: async () => {
      const { data } = await api.get<PublicRecipe[]>(`/api/v1/public/users/${username}/recipes`);
      return data;
    },
  });

  if (profileLoading) return <div className="p-8 text-sm" style={{ color: 'var(--color-warm-gray)' }}>Loading…</div>;
  if (!profile) return <div className="p-8 text-sm" style={{ color: '#b91c1c' }}>Profile not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Profile header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
          style={{ background: 'var(--color-cream-dark)', border: '2px solid var(--color-border)' }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name ?? profile.username} className="w-full h-full rounded-full object-cover" />
          ) : '👤'}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '0.25rem' }}>
          {profile.display_name ?? profile.username}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-warm-gray)' }}>@{profile.username}</p>
        {profile.bio && (
          <p className="text-base mt-3 max-w-md mx-auto leading-relaxed" style={{ color: 'var(--color-warm-gray)' }}>{profile.bio}</p>
        )}
      </div>

      {/* Recipe grid */}
      {recipesLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl animate-pulse" style={{ background: 'var(--color-cream-dark)', height: 220 }} />
          ))}
        </div>
      )}

      {recipes && recipes.length === 0 && (
        <p className="text-center py-16 text-sm" style={{ color: 'var(--color-warm-gray)' }}>
          No public recipes yet.
        </p>
      )}

      {recipes && recipes.length > 0 && (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: 'var(--color-warm-gray)' }}>
            {recipes.length} {recipes.length === 1 ? 'Recipe' : 'Recipes'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {recipes.map((r) => (
              <Link key={r.id} to={`/u/${username}/${r.slug}`} className="no-underline rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                style={{ background: 'white', border: '1px solid var(--color-border)', display: 'block' }}>
                {r.primary_image_url ? (
                  <img src={r.primary_image_url} alt={r.title} className="w-full object-cover" style={{ height: 140 }} />
                ) : (
                  <div className="w-full flex items-center justify-center" style={{ height: 140, background: 'var(--color-cream-dark)' }}>
                    <span style={{ fontSize: '2rem' }}>🍽</span>
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-medium line-clamp-2 mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--color-charcoal)', lineHeight: 1.4 }}>
                    {r.title}
                  </h3>
                  {r.total_time_minutes && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-warm-gray)' }}>
                      <Clock size={10} /> {r.total_time_minutes}m
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
