/**
 * DashboardLayout.jsx — shell for authenticated pages
 * Renders top nav with logo, user info, logout button, and a <main> content area.
 */
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from '../components/Badge';

export function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top navigation bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="Watchtower logo"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-slate-100 tracking-tight text-lg">Watchtower</span>
            </Link>

            {/* Nav links */}
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`
                }
              >
                Incidents
              </NavLink>
              <NavLink
                to="/status"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`
                }
              >
                Status Page
              </NavLink>
            </nav>

            {/* User info + logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-slate-400">{user?.name}</span>
                <RoleBadge role={user?.role} />
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-400 hover:text-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
