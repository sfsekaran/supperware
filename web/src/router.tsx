/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type AuthState } from './stores/authStore';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import PublicLayout from './layouts/PublicLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AddRecipePage from './pages/AddRecipePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import RecipeEditPage from './pages/RecipeEditPage';
import SettingsPage from './pages/SettingsPage';
import PublicProfilePage from './pages/public/PublicProfilePage';
import PublicRecipePage from './pages/public/PublicRecipePage';
import RequireAdmin from './components/RequireAdmin';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';

function RequireAuth() {
  const isAuthenticated = useAuthStore((s: AuthState) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function RequireGuest() {
  const isAuthenticated = useAuthStore((s: AuthState) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export const router = createBrowserRouter([
  // Public marketing + auth
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      {
        element: <RequireGuest />,
        children: [
          { path: '/login',  element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
        ],
      },
      { path: '/u/:username',       element: <PublicProfilePage /> },
      { path: '/u/:username/:slug', element: <PublicRecipePage /> },
    ],
  },
  // Authenticated app
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard',        element: <DashboardPage /> },
          { path: '/recipes/new',      element: <AddRecipePage /> },
          { path: '/recipes/:id',      element: <RecipeDetailPage /> },
          { path: '/recipes/:id/edit', element: <RecipeEditPage /> },
          { path: '/settings',         element: <SettingsPage /> },
        ],
      },
      {
        element: <RequireAdmin />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin',           element: <Navigate to="/admin/users" replace /> },
              { path: '/admin/users',     element: <AdminUsersPage /> },
              { path: '/admin/users/:id', element: <AdminUserDetailPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
