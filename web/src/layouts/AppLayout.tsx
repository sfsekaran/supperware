import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, Settings, LogOut, ChefHat, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sidebarNavItem = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline ${
          isActive ? 'text-white' : 'hover:opacity-80'
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

  const bottomNavItem = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 flex-1 py-2 text-xs font-medium transition-opacity no-underline ${
          isActive ? 'opacity-100' : 'opacity-55'
        }`
      }
      style={{ color: 'white' }}
    >
      {icon}
      {label}
    </NavLink>
  );

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar — hidden on mobile */}
      <aside
        className="app-sidebar w-56 flex-col py-6 px-4 shrink-0"
        style={{ background: 'var(--color-sage)', color: 'white' }}
      >
        <Link to="/dashboard" className="flex items-center gap-2 mb-8 no-underline">
          <ChefHat size={22} color="white" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>
            Supperware
          </span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {sidebarNavItem('/dashboard',   <BookOpen size={17} />,   'My Recipes')}
          {sidebarNavItem('/recipes/new', <PlusCircle size={17} />, 'Add Recipe')}
          {sidebarNavItem('/settings',    <Settings size={17} />,   'Settings')}
          {user?.admin && sidebarNavItem('/admin/users', <ShieldCheck size={17} />, 'Admin')}
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
      <main
        className="flex-1 overflow-y-auto pb-16 md:pb-0"
        style={{ background: 'var(--color-cream)' }}
      >
        <Outlet />
      </main>

      {/* Bottom tab bar — mobile only */}
      <nav
        className="app-bottom-nav fixed bottom-0 left-0 right-0 items-center px-2 z-50"
        style={{
          background: 'var(--color-sage)',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          height: '60px',
        }}
      >
        {bottomNavItem('/dashboard',   <BookOpen size={20} />,   'Recipes')}
        {bottomNavItem('/recipes/new', <PlusCircle size={20} />, 'Add')}
        {bottomNavItem('/settings',    <Settings size={20} />,   'Settings')}
        {user?.admin && bottomNavItem('/admin/users', <ShieldCheck size={20} />, 'Admin')}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 flex-1 py-2 text-xs font-medium opacity-55 hover:opacity-100 transition-opacity"
          style={{ color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <LogOut size={20} />
          Sign out
        </button>
      </nav>
    </div>
  );
}
