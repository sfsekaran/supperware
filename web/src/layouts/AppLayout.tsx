import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, Settings, LogOut, ChefHat } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItem = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
          isActive
            ? 'text-white'
            : 'hover:opacity-80'
        }`
      }
      style={({ isActive }) => ({
        background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
        color: 'white',
      })}
    >
      {icon}
      {label}
    </NavLink>
  );

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside
        className="w-56 flex flex-col py-6 px-4 shrink-0"
        style={{ background: 'var(--color-sage)', color: 'white' }}
      >
        <Link to="/dashboard" className="flex items-center gap-2 mb-8 no-underline">
          <ChefHat size={22} color="white" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>
            Supperware
          </span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {navItem('/dashboard',   <BookOpen size={17} />,   'My Recipes')}
          {navItem('/recipes/new', <PlusCircle size={17} />, 'Add Recipe')}
          {navItem('/settings',    <Settings size={17} />,   'Settings')}
        </nav>

        <div className="border-t pt-4 mt-4" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
          <div className="text-xs mb-3 opacity-70 truncate">
            {user?.display_name ?? user?.username}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm opacity-75 hover:opacity-100 transition-opacity"
            style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--color-cream)' }}>
        <Outlet />
      </main>
    </div>
  );
}
