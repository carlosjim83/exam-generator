import { PageHeader } from '@/components/layout/PageHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { MonitoringDashboard } from '@/features/monitoring/components/MonitoringDashboard';

export const metadata = {
  title: 'Worker Monitoring | Exam Generator',
  description: 'Real-time monitoring of document processing worker',
};

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Worker Monitoring"
        description="Real-time monitoring and observability for document processing"
        showBackButton
      />

      <PageContainer maxWidth="7xl">
        <MonitoringDashboard />
      </PageContainer>
    </div>
  );
}
