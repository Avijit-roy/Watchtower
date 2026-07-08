/**
 * StatusPage.jsx — public status page (no authentication required)
 * FR7-FR9: lists open incidents + recent resolved history.
 * Polls every 30 seconds so the page stays fresh without a manual refresh.
 */
import { useEffect, useState } from 'react';
import { getStatus } from '../api/incidents';
import { PublicLayout } from '../layouts/PublicLayout';
import { SeverityBadge, StatusBadge } from '../components/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatRelativeTime, formatDuration } from '../utils/formatDate';

export function StatusPage() {
  const [data, setData] = useState({ open: [], recent: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchStatus() {
    try {
      const result = await getStatus();
      setData(result);
      setLastUpdated(new Date());
    } catch {
      // Silent failure for polling — don't blank the page on a transient error
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    // Poll every 30 seconds — keeps the page current without Socket.io (added in Phase 2)
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const allClear = data.open.length === 0;

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Overall status indicator */}
        <div className={`rounded-2xl p-6 mb-8 text-center border ${allClear ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${allClear ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {allClear ? (
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            )}
          </div>
          <h1 className={`text-xl font-bold ${allClear ? 'text-emerald-400' : 'text-red-400'}`}>
            {isLoading ? 'Checking status...' : allClear ? 'All systems operational' : `${data.open.length} active incident${data.open.length > 1 ? 's' : ''}`}
          </h1>
          {lastUpdated && (
            <p className="text-xs text-slate-600 mt-1">Last updated {formatRelativeTime(lastUpdated)}</p>
          )}
        </div>

        {/* Loading */}
        {isLoading && <LoadingSpinner label="Loading status..." />}

        {/* Active incidents */}
        {!isLoading && data.open.length > 0 && (
          <section aria-label="Active incidents" className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Active incidents</h2>
            <div className="space-y-3">
              {data.open.map((incident) => (
                <PublicIncidentCard key={incident._id} incident={incident} />
              ))}
            </div>
          </section>
        )}

        {/* Recent history */}
        {!isLoading && data.recent.length > 0 && (
          <section aria-label="Recent incident history">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Recent history</h2>
            <div className="space-y-2">
              {data.recent.map((incident) => (
                <PublicIncidentCard key={incident._id} incident={incident} resolved />
              ))}
            </div>
          </section>
        )}

        {!isLoading && data.open.length === 0 && data.recent.length === 0 && (
          <p className="text-center text-sm text-slate-600">No recent incidents.</p>
        )}
      </div>
    </PublicLayout>
  );
}

function PublicIncidentCard({ incident, resolved = false }) {
  return (
    <div className={`card ${resolved ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          <p className="font-medium text-slate-100 text-sm">{incident.title}</p>
          {incident.affectedServices?.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">{incident.affectedServices.join(' · ')}</p>
          )}
        </div>
        <div className="text-right text-xs text-slate-600 flex-shrink-0">
          <p>{formatRelativeTime(incident.createdAt)}</p>
          {resolved && incident.resolvedAt && (
            <p>in {formatDuration(incident.createdAt, incident.resolvedAt)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
