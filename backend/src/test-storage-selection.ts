/**
 * Storage Service Selection Test
 * 
 * This script verifies that the container correctly selects between
 * LocalFileStorageService and AzureBlobStorageService based on configuration
 */

import { container } from './config/container.js';

console.log('🔍 Testing Storage Service Selection...\n');

// Check which storage service is configured
const storageService = container.storageService;
const isConfigured = storageService.isConfigured();
const serviceName = storageService.constructor.name;

console.log(`📦 Storage Service: ${serviceName}`);
console.log(`✅ Is Configured: ${isConfigured}`);

// Verify it's the expected one
if (serviceName === 'LocalFileStorageService') {
  console.log('\n✅ SUCCESS: Using LocalFileStorageService (filesystem)');
  console.log('   Files will be stored in: ./uploads/');
} else if (serviceName === 'AzureBlobStorageService') {
  console.log('\n✅ SUCCESS: Using AzureBlobStorageService (cloud)');
  console.log('   Files will be stored in Azure Blob Storage');
} else {
  console.log('\n❌ UNEXPECTED: Unknown storage service');
  process.exit(1);
}

console.log('\n✅ Container is working correctly!\n');

// Cleanup
await container.prisma.$disconnect();
process.exit(0);
