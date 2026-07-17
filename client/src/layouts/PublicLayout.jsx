/**
 * PublicLayout.jsx — minimal shell for unauthenticated pages (login, register, status page)
 */
import { Link } from 'react-router-dom';

export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/status" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="Watchtower logo"
                className="w-7 h-7 object-contain"
              />
              <span className="text-sm font-bold text-slate-100 tracking-tight">
                Watchtower
              </span>
            </Link>
            <Link to="/login" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-800/50 py-4 text-center text-xs text-slate-600">
        Watchtower — built for $0/month
      </footer>
    </div>
  );
}
