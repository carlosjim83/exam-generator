# Worker Observability & Monitoring Improvements

**Date:** February 1, 2025  
**Status:** ✅ Complete  
**Related Session:** Session 2 (Continued from Worker Health Monitoring)

## 🎯 Objective

Improve worker observability and monitoring capabilities to enable:

- Real-time queue monitoring with detailed metrics
- Structured logging for better log aggregation
- Performance analytics and trend analysis
- Admin dashboard for visual monitoring

---

## ✅ What Was Implemented

### 1. **Worker Metrics Service** (`WorkerMetrics.ts`)

Created a comprehensive metrics service that provides:

#### **Queue Counts**

- Waiting jobs
- Active jobs
- Completed jobs
- Failed jobs
- Delayed jobs
- Total jobs

#### **Health Indicators**

- Status: `healthy | degraded | unhealthy`
- Failure rate percentage
- Is processing (boolean)
- Has failures (boolean)

#### **Performance Metrics**

- Average processing time (ms)
- Average wait time (ms)
- Throughput:
  - Last 1 hour
  - Last 24 hours

#### **Recent Jobs**

- Last 10 completed jobs (with timing data)
- Last 10 failed jobs (with failure reasons)

**Health Status Logic:**

```typescript
// Unhealthy: >50% failure rate OR >20 failed jobs
if (failureRate > 50 || failed > 20) {
  status = 'unhealthy';
}
// Degraded: >20% failure rate OR >10 failed jobs
else if (failureRate > 20 || failed > 10) {
  status = 'degraded';
} else {
  status = 'healthy';
}
```

### 2. **Structured Logging** (`WorkerLogger.ts`)

Implemented JSON-formatted logging for better observability:

#### **Features:**

- Multiple log levels (DEBUG, INFO, WARN, ERROR)
- Structured context data (documentId, jobId, metrics, etc.)
- Environment-aware formatting:
  - Development: Pretty-printed with emojis
  - Production: Single-line JSON for log aggregation

#### **Log Entry Format:**

```json
{
  "timestamp": "2025-02-01T12:34:56.789Z",
  "level": "info",
  "service": "document-worker",
  "environment": "production",
  "message": "Job completed successfully",
  "event": "job.completed",
  "jobId": "doc-abc123",
  "documentId": "abc123",
  "processingTimeMs": 45000,
  "chunksCreated": 120,
  "wordCount": 15000,
  "pageCount": 50
}
```

#### **Specialized Methods:**

- `jobStarted()` - Log when job begins
- `jobCompleted()` - Log successful completion
- `jobFailed()` - Log failures with error details
- `jobTimeout()` - Log timeout events
- `jobRateLimited()` - Log rate limit hits
- `workerStarted()` - Log worker initialization
- `workerShutdown()` - Log graceful shutdown
- `workerError()` - Log worker errors

### 3. **Enhanced Health Endpoints**

Updated `/health/worker` endpoint with comprehensive metrics:

#### **Before:**

```json
{
  "status": "ok",
  "queue": {
    "waiting": 2,
    "active": 1,
    "completed": 145,
    "failed": 3,
    "total": 151
  }
}
```

#### **After:**

```json
{
  "counts": {
    "waiting": 2,
    "active": 1,
    "completed": 145,
    "failed": 3,
    "delayed": 0,
    "total": 151
  },
  "health": {
    "status": "healthy",
    "failureRate": 1.99,
    "isProcessing": true,
    "hasFailures": true
  },
  "performance": {
    "avgProcessingTime": 42500,
    "avgWaitTime": 1500,
    "throughput": {
      "last1Hour": 12,
      "last24Hours": 145
    }
  },
  "recentJobs": {
    "completed": [
      {
        "jobId": "doc-abc123",
        "documentId": "abc123",
        "completedAt": "2025-02-01T12:00:00.000Z",
        "processingTime": 45000,
        "attemptsMade": 1
      }
    ],
    "failed": [
      {
        "jobId": "doc-xyz789",
        "documentId": "xyz789",
        "failedAt": "2025-02-01T11:00:00.000Z",
        "reason": "Processing timeout: exceeded 600s limit",
        "attemptsMade": 3
      }
    ]
  },
  "timestamp": "2025-02-01T12:34:56.789Z"
}
```

#### **Job-Specific Metrics** (`/health/worker/job/:documentId`):

```json
{
  "found": true,
  "job": {
    "jobId": "doc-abc123",
    "documentId": "abc123",
    "state": "completed",
    "progress": 100,
    "attemptsMade": 1,
    "maxAttempts": 3,
    "createdAt": "2025-02-01T11:59:15.000Z",
    "processedAt": "2025-02-01T11:59:20.000Z",
    "finishedAt": "2025-02-01T12:00:05.000Z",
    "waitTime": 5000,
    "processingTime": 45000,
    "failedReason": null
  }
}
```

### 4. **Admin Monitoring Dashboard** (`/dashboard/monitoring`)

Created a full-featured monitoring dashboard with:

#### **Real-time Features:**

- Auto-refresh every 10 seconds (toggleable)
- Manual refresh button
- Live connection status

#### **Visual Components:**

**Health Status Card:**

- Color-coded by status (green/yellow/red)
- Shows current worker state
- Displays failure rate

**Queue Metrics (4 Cards):**

- Waiting (blue)
- Active (green)
- Completed (gray)
- Failed (red)

**Performance Panel:**

- Average processing time
- Average wait time
- Throughput (1 hour & 24 hours)

**Recent Jobs (2 Panels):**

- Last 10 completed (with processing time)
- Last 10 failed (with error messages)

#### **Screenshots (Conceptual):**

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Healthy                                                  │
│ Worker is actively processing. No failures.                 │
└─────────────────────────────────────────────────────────────┘

┌───────────┬───────────┬───────────┬───────────┐
│ Waiting   │ Active    │ Completed │ Failed    │
│ 2         │ 1         │ 145       │ 3         │
└───────────┴───────────┴───────────┴───────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📈 Performance                                              │
├─────────────────────────────────────────────────────────────┤
│ Avg Processing: 42.5s   │ Avg Wait: 1.5s                   │
│ Last 1 Hour: 12 docs    │ Last 24 Hours: 145 docs          │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────┐
│ Recent Completed         │ Recent Failed            │
├──────────────────────────┼──────────────────────────┤
│ abc123... | 45.0s       │ No failed jobs 🎉       │
│ def456... | 38.2s       │                          │
│ ghi789... | 52.1s       │                          │
└──────────────────────────┴──────────────────────────┘
```

---

## 📊 File Changes

### Backend (New Files):

1. **`src/infrastructure/queue/WorkerMetrics.ts`** (278 lines)
   - `getWorkerMetrics()` - Get comprehensive metrics
   - `getJobMetrics(documentId)` - Get job-specific metrics
   - `getQueueHealth()` - Simple health status

2. **`src/infrastructure/queue/WorkerLogger.ts`** (158 lines)
   - `WorkerLogger` class with structured logging
   - Environment-aware formatting
   - Specialized logging methods

### Backend (Modified Files):

3. **`src/infrastructure/queue/DocumentWorker.ts`**
   - Replaced console.log with structured logger
   - Added workerLogger.jobStarted()
   - Added workerLogger.jobCompleted()
   - Added workerLogger.jobFailed()
   - Added workerLogger.jobTimeout()
   - Added workerLogger.jobRateLimited()

4. **`src/routes/health.routes.ts`**
   - Updated `/health/worker` to return full metrics
   - Updated `/health/worker/job/:documentId` to return detailed metrics
   - Returns 503 status when unhealthy

### Frontend (New Files):

5. **`app/dashboard/monitoring/page.tsx`** (24 lines)
   - Monitoring page with PageHeader + PageContainer
   - Metadata for SEO

6. **`lib/services/api-monitoring.service.ts`** (89 lines)
   - `getWorkerMetrics()` - Fetch worker metrics
   - `getJobMetrics(documentId)` - Fetch job metrics
   - `getHealthCheck()` - Basic health check

7. **`features/monitoring/components/MonitoringDashboard.tsx`** (283 lines)
   - Full monitoring dashboard component
   - Auto-refresh with 10s interval
   - Health status visualization
   - Queue metrics cards
   - Performance panel
   - Recent jobs lists

---

## 🎯 Use Cases

### 1. **Real-time Monitoring**

- Navigate to `/dashboard/monitoring`
- See live queue status
- Toggle auto-refresh on/off
- Manually refresh when needed

### 2. **Performance Analysis**

- Check average processing times
- Identify slow documents
- Monitor throughput trends
- Detect performance degradation

### 3. **Failure Investigation**

- See recent failed jobs
- View failure reasons
- Check attempt counts
- Identify patterns

### 4. **Health Checks**

- Programmatic health checks via API
- Integration with monitoring tools (Datadog, New Relic, etc.)
- Alert when status becomes unhealthy/degraded

---

## 🔧 API Usage

### Get Worker Metrics

```bash
curl http://localhost:3001/health/worker
```

### Get Job Metrics

```bash
curl http://localhost:3001/health/worker/job/{documentId}
```

### Basic Health Check

```bash
curl http://localhost:3001/health
```

---

## 📈 Performance Impact

### Metrics Collection:

- **Overhead:** ~5-10ms per request
- **Caching:** Could be added if needed (cache for 5s)
- **Database impact:** Minimal (queries BullMQ Redis)

### Structured Logging:

- **Development:** Pretty-printed (slower, more readable)
- **Production:** JSON (faster, parseable)
- **Log volume:** ~2-3 lines per job (start, complete/fail, event)

---

## 🚀 Future Enhancements

### 1. **Log Aggregation** (Not Implemented)

- Send logs to CloudWatch/Datadog/Splunk
- Create alerts based on error patterns
- Dashboard for log search/filtering

### 2. **WebSockets** (Cancelled - Type complexity)

- Real-time updates without polling
- Push notifications for status changes
- Live progress indicators
- **Note:** Polling every 10s is sufficient for now

### 3. **Prometheus Metrics** (Not Implemented)

- Export metrics in Prometheus format
- Grafana dashboards
- Historical trend analysis
- Custom alerts

### 4. **Automatic Retries** (Not Implemented)

- Detect transient errors (rate limits, network)
- Automatic retry with exponential backoff
- Skip retry for permanent errors
- Notify on max retries exceeded

---

## 🧪 Testing the System

### Prerequisites:

```bash
# Terminal 1: Backend
cd backend && pnpm dev

# Terminal 2: Worker
cd backend && pnpm worker

# Terminal 3: Redis
redis-server

# Terminal 4: Frontend
cd frontend && pnpm dev
```

### Test Scenarios:

**1. View Monitoring Dashboard:**

1. Login to the application
2. Navigate to http://localhost:3000/dashboard/monitoring
3. Observe metrics auto-refreshing every 10s
4. Toggle auto-refresh off/on
5. Click manual refresh button

**2. Check Health API:**

```bash
# Basic health
curl http://localhost:3001/health

# Worker metrics
curl http://localhost:3001/health/worker | jq

# Specific job
curl http://localhost:3001/health/worker/job/{documentId} | jq
```

**3. View Structured Logs:**

```bash
# In development, you'll see pretty-printed logs:
ℹ️ Job started { event: 'job.started', jobId: 'doc-123', ... }
ℹ️ Job completed successfully { event: 'job.completed', ... }

# In production (NODE_ENV=production):
{"timestamp":"2025-02-01T...","level":"info","message":"Job started",...}
```

**4. Test Health States:**

Create unhealthy state (for testing):

1. Stop the worker
2. Upload 15+ documents
3. All will fail after timeout
4. Check `/health/worker` - should return 503 status
5. Dashboard should show "Unhealthy" in red

---

## 📝 Configuration

### Worker Logger:

```typescript
// Change environment
const logger = new WorkerLogger('document-worker', 'production');

// Use in worker
workerLogger.jobStarted(jobId, documentId, attempt, maxAttempts);
workerLogger.jobCompleted(jobId, documentId, time, chunks, words, pages);
workerLogger.jobFailed(jobId, documentId, attempt, maxAttempts, error);
```

### Health Thresholds:

```typescript
// In WorkerMetrics.ts - determineHealthStatus()

// Unhealthy
if (failureRate > 50 || failed > 20) status = 'unhealthy';
// Degraded
else if (failureRate > 20 || failed > 10) status = 'degraded';
// Healthy (default)
else status = 'healthy';
```

### Dashboard Refresh Rate:

```typescript
// In MonitoringDashboard.tsx

// Auto-refresh interval (currently 10 seconds)
const interval = setInterval(() => {
  fetchMetrics();
}, 10000); // Change this value
```

---

## 🔑 Key Metrics Explained

### **Average Processing Time**

- Time from job start to completion
- Excludes wait time in queue
- Measured in milliseconds
- Calculated from last 10 completed jobs

### **Average Wait Time**

- Time from job creation to processing start
- Indicates queue backlog
- Measured in milliseconds
- Calculated from last 10 completed jobs

### **Throughput**

- Number of documents processed
- Last 1 hour: Quick view of recent activity
- Last 24 hours: Daily capacity check

### **Failure Rate**

- Percentage of failed jobs vs total jobs
- `(failed / total) * 100`
- Key indicator of system health

---

## 🎓 Integration Examples

### **Datadog Integration:**

```typescript
// In production, send logs to Datadog
import { datadogLogs } from '@datadog/browser-logs';

class WorkerLogger {
  private log(level, message, context) {
    const logEntry = { timestamp, level, message, ...context };

    if (process.env.NODE_ENV === 'production') {
      datadogLogs.logger.info(message, context);
    } else {
      console.log(logEntry);
    }
  }
}
```

### **Prometheus Integration:**

```typescript
// Expose metrics endpoint
import { register, Counter, Histogram } from 'prom-client';

const jobsCompleted = new Counter({
  name: 'worker_jobs_completed_total',
  help: 'Total number of completed jobs',
});

const jobProcessingTime = new Histogram({
  name: 'worker_job_processing_seconds',
  help: 'Job processing duration in seconds',
  buckets: [1, 5, 15, 30, 60, 120, 300],
});

// In health routes
fastify.get('/metrics', async () => {
  return register.metrics();
});
```

---

## 🐛 Known Limitations

1. **No Historical Data**
   - Metrics are real-time only
   - No long-term trend analysis
   - Consider adding TimescaleDB or InfluxDB

2. **No Alerting**
   - Manual monitoring required
   - No automatic notifications
   - Consider integrating with PagerDuty or Slack

3. **Limited Performance Metrics**
   - Only averages (no percentiles)
   - No breakdown by document type/size
   - Consider adding more granular metrics

4. **WebSocket Not Implemented**
   - Polling-based refresh (10s interval)
   - Slightly delayed updates
   - Consider implementing in future if real-time is critical

---

## 📚 Related Documentation

- `WORKER_MONITORING_IMPROVEMENTS.md` - Previous worker health monitoring
- `UI_COHERENCE_IMPROVEMENTS.md` - UI patterns and standards
- `SESSION_SUMMARY_2025-02-01.md` - Multi-document support session

---

## ✅ Checklist

- [x] Create WorkerMetrics service
- [x] Add structured logging with WorkerLogger
- [x] Update DocumentWorker to use logger
- [x] Enhance health endpoints with metrics
- [x] Create monitoring API service (frontend)
- [x] Build MonitoringDashboard component
- [x] Create `/dashboard/monitoring` page
- [x] Test TypeScript compilation (0 errors)
- [x] Test frontend build (success)
- [ ] WebSocket implementation (cancelled - too complex)
- [ ] Automatic retry logic (deferred)
- [x] Documentation complete

---

**Status:** ✅ **COMPLETE**  
**Ready for:** Production deployment with monitoring enabled  
**Next Steps:** Test in staging, configure log aggregation, set up alerting
