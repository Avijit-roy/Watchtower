import { DashboardLayout } from '../layouts/DashboardLayout';
import { IncidentList } from '../features/incidents/IncidentList';

export function DashboardPage() {
  return (
    <DashboardLayout>
      <IncidentList />
    </DashboardLayout>
  );
}
