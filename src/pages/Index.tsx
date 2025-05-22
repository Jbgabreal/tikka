
import React from "react";
import HeroSection from "@/components/HeroSection";
import MeetChatta from "@/components/MeetChatta";
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
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;
