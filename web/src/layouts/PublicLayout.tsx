import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function PublicLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-cream)' }}>
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--color-terra)' }}>
            Supperware
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--color-terra)', color: 'white' }}
            >
              My Recipes
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium no-underline" style={{ color: 'var(--color-warm-gray)' }}>
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg text-sm font-medium no-underline"
                style={{ background: 'var(--color-terra)', color: 'white' }}
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="py-8 text-center text-sm" style={{ color: 'var(--color-warm-gray)', borderTop: '1px solid var(--color-border)' }}>
        © {new Date().getFullYear()} Supperware
      </footer>
    </div>
  );
}
