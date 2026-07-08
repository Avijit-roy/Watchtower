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
            <Link to="/status" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded-md bg-sky-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-100 transition-colors">
                Incident Command
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
        Incident Command — built for $0/month
      </footer>
    </div>
  );
}
