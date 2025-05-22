
import React from "react";
import { AnimatedBeamDemo } from "@/components/ui/beam-demo";

const AnimatedBeamSection = () => {
  return (
    <div className="py-20 bg-chatta-dark relative">
      {/* Background gradient elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-chatta-purple/10 filter blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-chatta-cyan/10 filter blur-2xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Connect with <span className="gradient-text">Everything</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10">
            Chatta seamlessly integrates with your favorite apps and services for a truly connected experience.
          </p>
        </div>
        
        {/* Animated beam demo */}
        <div className="max-w-4xl mx-auto">
          <AnimatedBeamDemo />
        </div>
      </div>
    </div>
  );
};

export default AnimatedBeamSection;
