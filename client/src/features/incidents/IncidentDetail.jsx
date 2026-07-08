/**
 * IncidentDetail.jsx — header section for a single incident:
 * title, badges, status update, assignee, affected services.
 * The Timeline is a separate component rendered below this one.
 */
import { useState } from 'react';
import { updateIncident } from '../../api/incidents';
import { useAuth } from '../../context/AuthContext';
import { SeverityBadge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { STATUSES, CAN_MUTATE_ROLES } from '../../utils/constants';
import { formatTimestamp, formatDuration } from '../../utils/formatDate';

export function IncidentDetail({ incident, onIncidentUpdated }) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const canMutate = CAN_MUTATE_ROLES.includes(user?.role);
  const isResolved = incident.status === 'Resolved';

  async function handleStatusChange(newStatus) {
    setIsUpdating(true);
    setError('');
    try {
      const { incident: updated } = await updateIncident(incident._id, { status: newStatus });
      onIncidentUpdated(updated);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  // Ordered list of valid next statuses to show as action buttons
  const currentIdx = STATUSES.indexOf(incident.status);
  const nextStatus = currentIdx < STATUSES.length - 1 ? STATUSES[currentIdx + 1] : null;

  return (
    <div className="card mb-6">
      {/* Incident header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
            {isResolved && incident.resolvedAt && (
              <span className="text-xs text-slate-500">
                resolved in {formatDuration(incident.createdAt, incident.resolvedAt)}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{incident.title}</h1>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 mb-4">
        <span>
          <span className="text-slate-600">Declared </span>
          {formatTimestamp(incident.createdAt)}
        </span>
        <span>
          <span className="text-slate-600">By </span>
          {incident.createdBy?.name}
        </span>
        {incident.assignedTo && (
          <span>
            <span className="text-slate-600">Assigned to </span>
            {incident.assignedTo.name}
          </span>
        )}
      </div>

      {/* Affected services */}
      {incident.affectedServices?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {incident.affectedServices.map((service) => (
            <span key={service} className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-xs border border-slate-700">
              {service}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {incident.description && (
        <p className="text-sm text-slate-400 leading-relaxed mb-4 bg-slate-800/50 rounded-lg px-4 py-3">
          {incident.description}
        </p>
      )}

      {/* Error */}
      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Status actions — only shown to responders/admins on non-resolved incidents */}
      {canMutate && !isResolved && nextStatus && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={nextStatus === 'Resolved' ? 'secondary' : 'primary'}
            size="sm"
            isLoading={isUpdating}
            onClick={() => handleStatusChange(nextStatus)}
            id={`btn-advance-status-${nextStatus.toLowerCase()}`}
          >
            Mark as {nextStatus}
          </Button>

          {/* Shortcut to resolve from any status */}
          {nextStatus !== 'Resolved' && (
            <Button
              variant="secondary"
              size="sm"
              isLoading={isUpdating}
              onClick={() => handleStatusChange('Resolved')}
              id="btn-resolve-incident"
            >
              Resolve incident
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
