
import React from "react";
import { Button } from "@/components/ui/button";
import ChatPreview from "./ChatPreview";

const HeroSection = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-chatta-darker z-0">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-chatta-purple/20 filter blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-chatta-cyan/10 filter blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }}></div>
      </div>
      
      <div className="container mx-auto z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
        <div className="flex flex-col max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Your <span className="gradient-text">AI Copilot</span> for Solana
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Trade, track, and explore the Solana blockchain — just by chatting.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              className="bg-gradient-to-r from-chatta-purple to-chatta-cyan hover:opacity-90 text-white font-bold px-8 py-6 rounded-xl text-lg glow"
            >
              Start Chatting
            </Button>
            <Button
              variant="outline"
              className="border-2 border-chatta-cyan text-white font-bold px-8 py-6 rounded-xl text-lg hover:bg-chatta-cyan/10"
            >
              See Demo
            </Button>
          </div>
        </div>
        
        <div className="w-full max-w-md animate-float">
          <ChatPreview />
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-gray-400">
        <p className="mb-2 text-sm">Scroll to explore</p>
        <svg 
          className="w-6 h-6 animate-bounce" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          ></path>
        </svg>
      </div>
    </div>
  );
};

export default HeroSection;
