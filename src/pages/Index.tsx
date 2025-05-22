import React from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MeetChatta from "@/components/MeetChatta";
import FaqSection from "@/components/FaqSection";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-chatta-dark text-white">
      <Navbar />
      <div id="home">
        <HeroSection />
      </div>
      <div id="meet-chatta">
        <MeetChatta />
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
