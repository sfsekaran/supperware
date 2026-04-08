import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Check, Key } from 'lucide-react';
import { useAuthStore, type AuthState } from '../stores/authStore';
import { api } from '../lib/api';

export default function SettingsPage() {
  const user = useAuthStore((s: AuthState) => s.user);
  const [copied, setCopied] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      // Fetch full user profile with api_token
      const { data } = await api.get<{ api_token: string }>('/api/v1/settings');
      return data;
    },
  });

  const copyToken = async () => {
    if (!settings?.api_token) return;
    await navigator.clipboard.writeText(settings.api_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-xl">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '0.5rem' }}>
        Settings
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-warm-gray)' }}>
        Manage your account and API access.
      </p>

      {/* Account */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-warm-gray)' }}>
          Account
        </h2>
        <div className="p-5 rounded-xl" style={{ background: 'white', border: '1px solid var(--color-border)' }}>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-warm-gray)' }}>Email</p>
              <p className="text-sm" style={{ color: 'var(--color-charcoal)' }}>{user?.email}</p>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
              <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-warm-gray)' }}>Username</p>
              <p className="text-sm" style={{ color: 'var(--color-charcoal)' }}>@{user?.username}</p>
            </div>
            {user?.display_name && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-warm-gray)' }}>Display name</p>
                <p className="text-sm" style={{ color: 'var(--color-charcoal)' }}>{user.display_name}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Public profile link */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-warm-gray)' }}>
          Public profile
        </h2>
        <div className="p-5 rounded-xl" style={{ background: 'white', border: '1px solid var(--color-border)' }}>
          <p className="text-sm mb-3" style={{ color: 'var(--color-warm-gray)' }}>
            Your public recipe page is visible to anyone with the link.
          </p>
          <a
            href={`/u/${user?.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium no-underline hover:underline"
            style={{ color: 'var(--color-terra)' }}
          >
            supperware.app/u/{user?.username} →
          </a>
        </div>
      </section>

      {/* API Token */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-warm-gray)' }}>
          API Token
        </h2>
        <div className="p-5 rounded-xl" style={{ background: 'white', border: '1px solid var(--color-border)' }}>
          <div className="flex items-start gap-3 mb-4">
            <Key size={16} style={{ color: 'var(--color-warm-gray)', marginTop: 2, flexShrink: 0 }} />
            <p className="text-sm" style={{ color: 'var(--color-warm-gray)', lineHeight: 1.6 }}>
              Use this token to authenticate the browser extension. Treat it like a password — don't share it publicly.
            </p>
          </div>

          {settings?.api_token ? (
            <div className="flex items-center gap-2">
              <code
                className="flex-1 text-xs px-3 py-2.5 rounded-lg truncate"
                style={{ background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)', fontFamily: 'ui-monospace, monospace' }}
              >
                {settings.api_token}
              </code>
              <button
                onClick={copyToken}
                className="px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0"
                style={{ background: copied ? '#e8f0e5' : 'var(--color-cream-dark)', color: copied ? 'var(--color-sage)' : 'var(--color-charcoal)', border: 'none', cursor: 'pointer' }}
              >
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
          ) : (
            <div className="text-sm" style={{ color: 'var(--color-warm-gray)' }}>
              Token will appear here. Make sure the API is running and the settings endpoint is implemented.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
