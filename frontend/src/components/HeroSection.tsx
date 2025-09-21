import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ChatPreview from "./ChatPreview";
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play } from "lucide-react";

const HeroSection = () => {
  const fullText = "Your command line for Solana, powered by AI";
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 70);
      
      return () => clearTimeout(timeout);
    } else {
      setIsTypingComplete(true);
    }
  }, [currentIndex, fullText]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden pt-20 sm:pt-24 pb-32">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 z-0">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-orange-50/40 to-orange-100/30 dark:from-slate-900 dark:via-orange-900/30 dark:to-orange-800/20 transition-colors duration-300"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-orange-500/30 filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-orange-600/25 filter blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-orange-400/20 filter blur-3xl animate-pulse" style={{ animationDelay: "4s" }}></div>
        
        {/* Particle Effect */}
        <div className="particle-bg">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="container mx-auto z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
        <div className="flex flex-col max-w-2xl text-center lg:text-left">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 font-display leading-tight">
            <span className={`${isTypingComplete ? 'gradient-text' : 'text-gray-900 dark:text-white'}`}>
              {displayText}
            </span>
            <span className="cursor inline-block h-10 w-2 bg-gradient-to-b from-orange-500 to-orange-600 animate-pulse ml-2" style={{ animationDuration: '0.8s' }}></span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Swap tokens, launch projects, track sentiment, and manage portfolios all through one chat.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/chat')}
              rightIcon={<Play className="w-5 h-5" />}
            >
              Start Chatting
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => document.getElementById('meet-tikka')?.scrollIntoView({ behavior: 'smooth' })}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Learn More
            </Button>
          </div>
        </div>
        
        <div className="w-full max-w-lg animate-float">
          <div className="neo-card p-6">
            <ChatPreview />
          </div>
        </div>
      </div>
      
      {/* Enhanced Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-gray-500 dark:text-gray-400">
        <p className="mb-3 text-sm font-medium">Scroll to explore</p>
        <div className="w-6 h-10 border-2 border-orange-500/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
      
      {/* Gradient Transition */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent via-slate-50/70 to-slate-50 dark:via-slate-900/70 dark:to-slate-900 pointer-events-none transition-colors duration-300"></div>
    </div>
  );
};

export default HeroSection;
