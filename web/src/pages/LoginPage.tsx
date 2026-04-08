import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md">
        <h1
          className="text-center mb-2"
          style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--color-charcoal)' }}
        >
          Welcome back
        </h1>
        <p className="text-center mb-8 text-sm" style={{ color: 'var(--color-warm-gray)' }}>
          Sign in to your Supperware account
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-3 rounded-xl text-base outline-none"
              style={{ border: '1.5px solid var(--color-border)', background: 'white', color: 'var(--color-charcoal)' }}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="px-4 py-3 rounded-xl text-base outline-none"
              style={{ border: '1.5px solid var(--color-border)', background: 'white', color: 'var(--color-charcoal)' }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="py-3 rounded-xl font-semibold text-base mt-2"
            style={{ background: 'var(--color-terra)', color: 'white', opacity: loading ? 0.7 : 1, cursor: loading ? 'wait' : 'pointer', border: 'none' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-warm-gray)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--color-terra)', fontWeight: 500 }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
