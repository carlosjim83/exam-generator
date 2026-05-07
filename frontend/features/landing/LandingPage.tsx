import { LandingNavigation } from './components/LandingNavigation';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { TeacherSection } from './components/TeacherSection';
import { StudentSection } from './components/StudentSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { PricingSection } from './components/PricingSection';
import { Footer } from './components/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <LandingNavigation />

      <main>
        <HeroSection />
        <FeaturesSection id="features" />
        <TeacherSection />
        <StudentSection />
        <HowItWorksSection />
        <PricingSection id="pricing" />
      </main>

      <Footer />
    </div>
  );
}
