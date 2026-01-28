#!/usr/bin/env node
/**
 * Document Processing Worker Entry Point
 *
 * Run this script to start the background worker that processes documents from the queue.
 *
 * Usage:
 *   node dist/worker.js
 *   OR
 *   pnpm worker (from package.json script)
 */

import './src/infrastructure/queue/DocumentWorker.js';

console.log('📦 Worker process started');
