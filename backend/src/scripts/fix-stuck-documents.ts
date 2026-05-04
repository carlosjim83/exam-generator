import { Container } from '@config/container.js';

async function main() {
  const minutesStuck = parseInt(process.argv[2] || '5', 10);

  if (isNaN(minutesStuck) || minutesStuck < 1) {
    console.error('Usage: node dist/scripts/fix-stuck-documents.js [minutesStuck]');
    console.error('  minutesStuck: Minimum minutes in PROCESSING to consider stuck (default: 5)');
    process.exit(1);
  }

  const container = Container.getInstance();

  console.log(`🔍 Looking for documents stuck in PROCESSING for >${minutesStuck} minutes...\n`);

  const result = await container.fixStuckDocumentsUseCase.execute({ minutesStuck });

  console.log('\n🏁 Summary:');
  console.log(`   Recovered: ${result.recovered}`);
  console.log(`   Failed:    ${result.failed}`);

  if (result.documents.length > 0) {
    console.log('\n📋 Details:');
    for (const doc of result.documents) {
      const icon = doc.requeued ? '✅' : '❌';
      console.log(
        `   ${icon} ${doc.documentId} (user: ${doc.userId}) → ${doc.status}${doc.error ? ` | Error: ${doc.error}` : ''}`
      );
    }
  }

  await container.prisma.$disconnect();
  process.exit(result.failed > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
