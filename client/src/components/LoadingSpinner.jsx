/**
 * LoadingSpinner.jsx — full-page and inline loading indicators
 */

export function LoadingSpinner({ size = 'md', label = 'Loading...' }) {
  const sizeClass = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-label={label}>
      <div className={`${sizeClass} rounded-full border-slate-700 border-t-sky-500 animate-spin`} />
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}

/** Full-page loading screen — used while AuthContext restores session */
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <LoadingSpinner size="lg" label="Loading Incident Command..." />
    </div>
  );
}
