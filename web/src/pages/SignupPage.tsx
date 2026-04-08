import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, type AuthState } from '../stores/authStore';

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const signup = useAuthStore((s: AuthState) => s.signup);
  const navigate = useNavigate();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await signup(form.email, form.password, form.confirm, form.username, form.displayName || undefined);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { border: '1.5px solid var(--color-border)', background: 'white', color: 'var(--color-charcoal)' };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-center mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
          Create your account
        </h1>
        <p className="text-center mb-8 text-sm" style={{ color: 'var(--color-warm-gray)' }}>
          Free forever, no credit card needed
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>Email</label>
            <input type="email" value={form.email} onChange={set('email')} required
              className="px-4 py-3 rounded-xl text-base outline-none" style={inputStyle} placeholder="you@example.com" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>Username</label>
              <input type="text" value={form.username} onChange={set('username')} required
                className="px-4 py-3 rounded-xl text-base outline-none" style={inputStyle} placeholder="chef_alice" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>Display name <span className="opacity-50">(optional)</span></label>
              <input type="text" value={form.displayName} onChange={set('displayName')}
                className="px-4 py-3 rounded-xl text-base outline-none" style={inputStyle} placeholder="Alice" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>Password</label>
            <input type="password" value={form.password} onChange={set('password')} required minLength={8}
              className="px-4 py-3 rounded-xl text-base outline-none" style={inputStyle} placeholder="Min. 8 characters" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>Confirm password</label>
            <input type="password" value={form.confirm} onChange={set('confirm')} required
              className="px-4 py-3 rounded-xl text-base outline-none" style={inputStyle} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading}
            className="py-3 rounded-xl font-semibold text-base mt-2"
            style={{ background: 'var(--color-terra)', color: 'white', opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer', border: 'none' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-warm-gray)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-terra)', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
