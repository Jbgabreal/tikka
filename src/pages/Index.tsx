
import React from "react";
import HeroSection from "@/components/HeroSection";
import MeetChatta from "@/components/MeetChatta";
import FaqSection from "@/components/FaqSection";
import AnimatedBeamSection from "@/components/AnimatedBeamSection";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-chatta-dark text-white">
      <div id="home">
        <HeroSection />
      </div>
      <div id="meet-chatta">
        <MeetChatta />
      </div>
      <div id="integrations">
        <AnimatedBeamSection />
      </div>
      <div id="faq">
        <FaqSection />
      </div>
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;
