import { LandingPage } from '@/features/landing/LandingPage';
import { SafeTranslation } from '@/components/SafeTranslation';

export default function Home() {
  return (
    <SafeTranslation>
      <LandingPage />
    </SafeTranslation>
  );
}

export const dynamic = 'force-dynamic';
