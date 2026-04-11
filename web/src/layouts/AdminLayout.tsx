import { Link, NavLink, Outlet } from 'react-router-dom';
import { Users, ChefHat } from 'lucide-react';

export default function AdminLayout() {
  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--color-cream)' }}>
      {/* Sidebar */}
      <aside
        className="w-52 flex-col py-6 px-4 shrink-0 flex"
        style={{ background: '#2d2d2d', color: 'white' }}
      >
        <div className="mb-6">
          <Link to="/dashboard" className="flex items-center gap-2 no-underline opacity-60 hover:opacity-100 transition-opacity mb-1" style={{ color: 'white', fontSize: '0.75rem' }}>
            ← Back to app
          </Link>
          <div className="flex items-center gap-2 mt-4">
            <ChefHat size={18} color="white" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'white' }}>
              Admin
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
                isActive ? 'opacity-100' : 'opacity-55 hover:opacity-80'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: 'white',
            })}
          >
            <Users size={16} />
            Users
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
