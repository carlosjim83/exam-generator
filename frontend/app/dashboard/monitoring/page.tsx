import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MonitoringDashboard } from '@/features/monitoring/components/MonitoringDashboard';

export default function MonitoringPage() {
  return (
    <DashboardLayout>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Worker Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and observability for document processing
          </p>
        </div>
        <MonitoringDashboard />
      </div>
    </DashboardLayout>
  );
}
