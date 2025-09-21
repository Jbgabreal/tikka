import React from "react";
import HeroSection from "@/components/HeroSection";
import MeetChatta from "@/components/MeetChatta";
import FeaturesGrid from "@/components/FeaturesGrid";
import HowItWorks from "@/components/HowItWorks";
import CtaSection from "@/components/CtaSection";
import FaqSection from "@/components/FaqSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-orange-50/20 to-pink-50/20 dark:from-slate-900 dark:via-orange-900/20 dark:to-pink-900/20 text-gray-900 dark:text-white overflow-auto hide-scrollbar transition-colors duration-300">
      {/* Background ambient dots */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#f8fafc,_#f1f5f9)] dark:bg-[radial-gradient(ellipse_at_top_left,_#12121a,_#0a090e)] pointer-events-none transition-colors duration-300">
          {/* Ambient dots */}
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-orange-500/10 dark:bg-orange-500/5 pointer-events-none"
              style={{
                width: `${Math.random() * 10 + 3}px`,
                height: `${Math.random() * 10 + 3}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 20 + 10}s`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.3
              }}
            />
          ))}
        </div>

        {/* Subtle glow in top-left */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/20 dark:bg-orange-500/10 blur-[100px] rounded-full pointer-events-none transition-colors duration-300" />

        {/* Secondary glow */}
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-teal-500/10 dark:bg-teal-500/5 blur-[80px] rounded-full pointer-events-none transition-colors duration-300" />
      </div>

      {/* Content sections with proper z-index */}
      <div className="relative z-10">
        <HeroSection />
        <MeetChatta />
        <FeaturesGrid />
        <HowItWorks />
        <CtaSection />
        <FaqSection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
