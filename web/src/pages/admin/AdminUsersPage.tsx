import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  public_profile: boolean;
  admin: boolean;
  recipe_count: number;
  created_at: string;
}

interface AdminUsersResponse {
  users: AdminUser[];
  meta: { total: number; page: number; per_page: number; pages: number };
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: async () => {
      const { data } = await api.get<AdminUsersResponse>(`/api/v1/admin/users?page=${page}`);
      return data;
    },
  });

  const users = data?.users ?? [];
  const meta  = data?.meta;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: '1.5rem' }}>
        Users
        {meta && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 400, marginLeft: '0.75rem', opacity: 0.5 }}>
            {meta.total} total
          </span>
        )}
      </h1>

      {isLoading && <p style={{ opacity: 0.5 }}>Loading…</p>}
      {isError  && <p style={{ color: 'var(--color-terracotta)' }}>Failed to load users.</p>}

      {!isLoading && !isError && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-sage-light, #c8d5c0)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Username</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Display name</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Recipes</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Joined</th>
                  <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Flags</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <Link to={`/admin/users/${u.id}`} style={{ fontWeight: 500 }}>
                        {u.username}
                      </Link>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', opacity: 0.7 }}>{u.email}</td>
                    <td style={{ padding: '0.6rem 0.75rem', opacity: 0.7 }}>{u.display_name ?? '—'}</td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>{u.recipe_count}</td>
                    <td style={{ padding: '0.6rem 0.75rem', opacity: 0.6, whiteSpace: 'nowrap' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {u.public_profile && <Badge color="#6b8f71">public</Badge>}
                        {u.admin          && <Badge color="#a0522d">admin</Badge>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: '1px solid currentColor', borderRadius: '6px', padding: '0.35rem 0.75rem', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={15} /> Prev
              </button>
              <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                Page {meta.page} of {meta.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                disabled={page === meta.pages}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: '1px solid currentColor', borderRadius: '6px', padding: '0.35rem 0.75rem', cursor: page === meta.pages ? 'default' : 'pointer', opacity: page === meta.pages ? 0.4 : 1 }}
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
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
