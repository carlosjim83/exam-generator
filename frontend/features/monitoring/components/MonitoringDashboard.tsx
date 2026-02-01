'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getWorkerMetrics, type WorkerMetrics } from '@/lib/services/api-monitoring.service';
import { RefreshCw, Activity, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<WorkerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      const data = await getWorkerMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Metrics</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchMetrics} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const healthColor = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    degraded: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    unhealthy: 'bg-red-100 text-red-800 border-red-200',
  }[metrics.health.status];

  const healthIcon = {
    healthy: <CheckCircle className="h-4 w-4" />,
    degraded: <AlertCircle className="h-4 w-4" />,
    unhealthy: <AlertCircle className="h-4 w-4" />,
  }[metrics.health.status];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
          <p className="text-sm text-gray-500">
            Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="mr-2 h-4 w-4" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <Card className={healthColor}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {healthIcon}
            <CardTitle className="capitalize">{metrics.health.status}</CardTitle>
          </div>
          <CardDescription className="text-sm font-normal">
            Worker is {metrics.health.isProcessing ? 'actively processing' : 'idle'}.{' '}
            {metrics.health.hasFailures &&
              `Failure rate: ${metrics.health.failureRate.toFixed(1)}%`}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Queue Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Waiting"
          value={metrics.counts.waiting}
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          color="blue"
        />
        <MetricCard
          title="Active"
          value={metrics.counts.active}
          icon={<Activity className="h-4 w-4 text-green-500" />}
          color="green"
        />
        <MetricCard
          title="Completed"
          value={metrics.counts.completed}
          icon={<CheckCircle className="h-4 w-4 text-gray-500" />}
          color="gray"
        />
        <MetricCard
          title="Failed"
          value={metrics.counts.failed}
          icon={<AlertCircle className="h-4 w-4 text-red-500" />}
          color="red"
        />
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Processing Time</p>
              <p className="text-2xl font-bold">
                {(metrics.performance.avgProcessingTime / 1000).toFixed(1)}s
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Wait Time</p>
              <p className="text-2xl font-bold">
                {(metrics.performance.avgWaitTime / 1000).toFixed(1)}s
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last 1 Hour</p>
              <p className="text-2xl font-bold">{metrics.performance.throughput.last1Hour} docs</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last 24 Hours</p>
              <p className="text-2xl font-bold">
                {metrics.performance.throughput.last24Hours} docs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Completed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Completed</CardTitle>
            <CardDescription>Last 10 successfully processed documents</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.recentJobs.completed.length === 0 ? (
              <p className="text-sm text-gray-500">No completed jobs yet</p>
            ) : (
              <div className="space-y-2">
                {metrics.recentJobs.completed.map((job) => (
                  <div
                    key={job.jobId}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {job.documentId.substring(0, 8)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(job.completedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {(job.processingTime / 1000).toFixed(1)}s
                      </p>
                      {job.attemptsMade > 1 && (
                        <p className="text-xs text-yellow-600">{job.attemptsMade} attempts</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Failed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Failed</CardTitle>
            <CardDescription>Last 10 failed processing attempts</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.recentJobs.failed.length === 0 ? (
              <p className="text-sm text-green-600">No failed jobs 🎉</p>
            ) : (
              <div className="space-y-2">
                {metrics.recentJobs.failed.map((job) => (
                  <div
                    key={job.jobId}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {job.documentId.substring(0, 8)}...
                      </p>
                      <p className="text-xs text-gray-600">{job.reason}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(job.failedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="destructive">{job.attemptsMade} attempts</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Failed to refresh metrics: {error}. Using last known values.
          </p>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'gray' | 'red';
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    gray: 'bg-gray-50 border-gray-100',
    red: 'bg-red-50 border-red-100',
  };

  return (
    <Card className={colorClasses[color]}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}
