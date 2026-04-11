import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ExternalLink } from 'lucide-react';

interface AdminUserDetail {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  public_profile: boolean;
  admin: boolean;
  recipe_count: number;
  created_at: string;
}

interface AdminRecipe {
  id: number;
  title: string | null;
  slug: string;
  visibility: string;
  status: string;
  created_at: string;
}

interface AdminUserDetailResponse {
  user: AdminUserDetail;
  recipes: AdminRecipe[];
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: async () => {
      const { data } = await api.get<AdminUserDetailResponse>(`/api/v1/admin/users/${id}`);
      return data;
    },
  });

  if (isLoading) return <div style={{ padding: '2rem', opacity: 0.5 }}>Loading…</div>;
  if (isError || !data)  return <div style={{ padding: '2rem', color: 'var(--color-terracotta)' }}>Failed to load user.</div>;

  const { user, recipes } = data;

  return (
    <div style={{ padding: '2rem', maxWidth: '860px' }}>
      <Link to="/admin/users" style={{ fontSize: '0.85rem', opacity: 0.5, display: 'inline-block', marginBottom: '1.25rem' }}>
        ← All users
      </Link>

      {/* User card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'flex-start',
      }}>
        {user.avatar_url && (
          <img src={user.avatar_url} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: 0 }}>
              {user.display_name ?? user.username}
            </h1>
            {user.public_profile && <Badge color="#6b8f71">public</Badge>}
            {user.admin          && <Badge color="#a0522d">admin</Badge>}
          </div>
          <div style={{ opacity: 0.55, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            @{user.username} · {user.email}
          </div>
          {user.bio && (
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', opacity: 0.75 }}>{user.bio}</p>
          )}
          <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>
            Joined {new Date(user.created_at).toLocaleDateString()} · {user.recipe_count} recipe{user.recipe_count !== 1 ? 's' : ''}
          </div>
        </div>
        {user.public_profile && (
          <a
            href={`/u/${user.username}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              fontSize: '0.85rem', fontWeight: 500,
              padding: '0.4rem 0.9rem', borderRadius: '8px',
              background: 'var(--color-sage)', color: 'white',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            View profile <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Recipes */}
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '1rem' }}>
        Recipes ({recipes.length})
      </h2>

      {recipes.length === 0 ? (
        <p style={{ opacity: 0.5 }}>No recipes yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-sage-light, #c8d5c0)', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Title</th>
              <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Visibility</th>
              <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Added</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <td style={{ padding: '0.6rem 0.75rem', fontWeight: 500 }}>
                  {r.visibility === 'public' ? (
                    <a
                      href={`/u/${user.username}/${r.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      {r.title ?? '(untitled)'} <ExternalLink size={11} />
                    </a>
                  ) : (
                    r.title ?? '(untitled)'
                  )}
                </td>
                <td style={{ padding: '0.6rem 0.75rem' }}>
                  <Badge color={r.visibility === 'public' ? '#6b8f71' : r.visibility === 'unlisted' ? '#8b7355' : '#999'}>
                    {r.visibility}
                  </Badge>
                </td>
                <td style={{ padding: '0.6rem 0.75rem', opacity: 0.65 }}>{r.status}</td>
                <td style={{ padding: '0.6rem 0.75rem', opacity: 0.55, whiteSpace: 'nowrap' }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      background: color,
      color: 'white',
      fontSize: '0.7rem',
      fontWeight: 600,
      padding: '0.15rem 0.45rem',
      borderRadius: '999px',
      letterSpacing: '0.02em',
    }}>
      {children}
    </span>
  );
}
