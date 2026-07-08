/**
 * IncidentList.jsx — dashboard list of all incidents
 * Fetches on mount, shows loading/empty/error states, and opens the create modal.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents } from '../../api/incidents';
import { useAuth } from '../../context/AuthContext';
import { SeverityBadge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { IncidentForm } from './IncidentForm';
import { SEVERITY_CONFIG, CAN_MUTATE_ROLES } from '../../utils/constants';
import { formatRelativeTime, formatDuration } from '../../utils/formatDate';

export function IncidentList() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Compute UI-readable values before JSX
  const canCreate = CAN_MUTATE_ROLES.includes(user?.role);
  const openIncidents = incidents.filter((i) => i.status !== 'Resolved');
  const resolvedIncidents = incidents.filter((i) => i.status === 'Resolved');

  useEffect(() => {
    async function fetchIncidents() {
      try {
        const { incidents: data } = await getIncidents();
        setIncidents(data);
      } catch {
        setError("Couldn't load incidents — try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchIncidents();
  }, []);

  function handleIncidentCreated(newIncident) {
    setIncidents((prev) => [newIncident, ...prev]);
    setShowCreateForm(false);
  }

  if (isLoading) {
    return <div className="flex justify-center mt-20"><LoadingSpinner size="lg" label="Loading incidents..." /></div>;
  }

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Incidents</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {openIncidents.length} open · {resolvedIncidents.length} resolved
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={() => setShowCreateForm(true)} id="btn-declare-incident">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Declare incident
          </Button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div role="alert" className="card border-red-500/30 text-red-400 mb-6">{error}</div>
      )}

      {/* Empty state */}
      {!error && incidents.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-300">No open incidents</h2>
          <p className="text-sm text-slate-500 mt-1">You&apos;re all clear — no active incidents right now.</p>
          {canCreate && (
            <Button variant="primary" className="mt-4" onClick={() => setShowCreateForm(true)}>
              Declare incident
            </Button>
          )}
        </div>
      )}

      {/* Open incidents */}
      {openIncidents.length > 0 && (
        <section aria-label="Open incidents" className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Active</h2>
          <div className="space-y-3">
            {openIncidents.map((incident) => (
              <IncidentCard key={incident._id} incident={incident} />
            ))}
          </div>
        </section>
      )}

      {/* Resolved incidents */}
      {resolvedIncidents.length > 0 && (
        <section aria-label="Resolved incidents">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Resolved</h2>
          <div className="space-y-2">
            {resolvedIncidents.map((incident) => (
              <IncidentCard key={incident._id} incident={incident} dimmed />
            ))}
          </div>
        </section>
      )}

      {/* Create modal */}
      {showCreateForm && (
        <IncidentForm onCreated={handleIncidentCreated} onClose={() => setShowCreateForm(false)} />
      )}
    </>
  );
}

/** Individual incident card */
function IncidentCard({ incident, dimmed = false }) {
  const severityBorder = SEVERITY_CONFIG[incident.severity]?.cardBorderClass || '';

  return (
    <Link
      to={`/incidents/${incident._id}`}
      className={`block card ${severityBorder} hover:border-slate-700 hover:bg-slate-800/50 transition-colors group ${dimmed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          <h3 className="font-semibold text-slate-100 group-hover:text-white truncate-2">
            {incident.title}
          </h3>
          {incident.affectedServices?.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              {incident.affectedServices.join(' · ')}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0 text-xs text-slate-500 space-y-1">
          <p>{formatRelativeTime(incident.createdAt)}</p>
          {incident.status !== 'Resolved' && (
            <p className="text-slate-600">{formatDuration(incident.createdAt)} open</p>
          )}
          {incident.status === 'Resolved' && incident.resolvedAt && (
            <p className="text-slate-600">in {formatDuration(incident.createdAt, incident.resolvedAt)}</p>
          )}
          <p className="text-slate-600">by {incident.createdBy?.name}</p>
        </div>
      </div>
    </Link>
  );
}
