import { Queue } from 'bullmq';
import { env } from '../src/config/env.js';

const queue = new Queue('document-processing', {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    tls: {
      servername: env.REDIS_HOST,
    },
  },
});

async function clearQueue() {
  console.log('🧹 Cleaning failed and completed jobs...');

  // Remove all failed jobs
  const failedCount = await queue.clean(0, 1000, 'failed');
  console.log(`✅ Removed ${failedCount.length} failed jobs`);

  // Remove all completed jobs
  const completedCount = await queue.clean(0, 1000, 'completed');
  console.log(`✅ Removed ${completedCount.length} completed jobs`);

  // Get waiting jobs
  const waitingJobs = await queue.getWaiting();
  console.log(`📋 Waiting jobs: ${waitingJobs.length}`);
  for (const job of waitingJobs) {
    console.log(`  - Job ${job.id}: ${job.name}`);
  }

  await queue.close();
  console.log('✅ Queue cleaned!');
  process.exit(0);
}

clearQueue().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
