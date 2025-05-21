
import React from "react";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import FeaturesGrid from "@/components/FeaturesGrid";
import LiveChatPreview from "@/components/LiveChatPreview";
import TrustMetrics from "@/components/TrustMetrics";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-chatta-dark text-white">
      <HeroSection />
      <HowItWorks />
      <FeaturesGrid />
      <LiveChatPreview />
      <TrustMetrics />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;
