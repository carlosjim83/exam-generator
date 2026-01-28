import { existsSync, rmSync } from 'fs';

/**
 * Cleanup Test Artifacts
 * Removes temporary directories created during tests
 */

const TEST_DIRECTORIES = [
  './test-uploads', // Integration tests - file storage
  './temp', // ProcessDocumentUseCase temp files
  './uploads', // E2E tests - might create files here
];

/**
 * Clean up all test artifact directories
 * Call this in afterAll hooks
 */
export function cleanupTestArtifacts(): void {
  for (const dir of TEST_DIRECTORIES) {
    if (existsSync(dir)) {
      try {
        rmSync(dir, { recursive: true, force: true });
        console.log(`🗑️  Cleaned up ${dir}`);
      } catch (error) {
        console.warn(`⚠️  Failed to clean ${dir}:`, error);
      }
    }
  }
}

/**
 * Clean up a specific directory
 */
export function cleanupDirectory(dirPath: string): void {
  if (existsSync(dirPath)) {
    try {
      rmSync(dirPath, { recursive: true, force: true });
      console.log(`🗑️  Cleaned up ${dirPath}`);
    } catch (error) {
      console.warn(`⚠️  Failed to clean ${dirPath}:`, error);
    }
  }
}
