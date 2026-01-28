/**
 * Vitest Global Teardown
 * Runs once after ALL test files complete
 *
 * Usage: Call this manually after test run, or integrate with CI/CD
 * Example: pnpm vitest run && node -e "import('./tests/global-teardown.js').then(m => m.default())"
 */

import { cleanupTestArtifacts } from './helpers/cleanup.js';

export default async function globalTeardown() {
  console.log('\n🧹 Running global cleanup after all tests...');
  cleanupTestArtifacts();
}
