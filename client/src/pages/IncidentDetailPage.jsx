/**
 * IncidentDetailPage.jsx — loads a single incident and renders
 * IncidentDetail (header) + Timeline side by side on larger screens.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIncident } from '../api/incidents';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { IncidentDetail } from '../features/incidents/IncidentDetail';
import { Timeline } from '../features/incidents/Timeline';
import { Postmortem } from '../features/incidents/Postmortem';
import { PageLoader } from '../components/LoadingSpinner';
import { Button } from '../components/Button';
import { useIncidentSocket } from '../features/incidents/useIncidentSocket';

export function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // ponytail: subscribe to incident detail real-time updates
  useIncidentSocket(id, {
    onIncidentUpdated: (updated) => setIncident(updated),
    onTimelineEntryCreated: () => {},
  });

  useEffect(() => {
    async function fetchIncident() {
      try {
        const { incident: data } = await getIncident(id);
        setIncident(data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Incident not found.');
        } else {
          setError("Couldn't load this incident — try refreshing.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchIncident();
  }, [id]);

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <DashboardLayout>
        <div className="card text-center py-16">
          <p className="text-red-400 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back to incidents</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Back link */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-4">
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        All incidents
      </Button>

      {/* Two-column layout on md+ screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident header takes 2/3 on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <IncidentDetail
            incident={incident}
            onIncidentUpdated={(updated) => setIncident(updated)}
          />
          <Postmortem
            incident={incident}
            onIncidentUpdated={(updated) => setIncident(updated)}
          />
        </div>

        {/* Timeline takes 1/3 */}
        <div className="lg:col-span-1">
          <Timeline incidentId={id} incidentStatus={incident.status} />
        </div>
      </div>
    </DashboardLayout>
  );
}
