import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Rocket } from "lucide-react";

const CtaSection = () => {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const buyUrl = `https://pump.fun/coin/${contractAddress}`;

  const handleBuyToken = () => {
    window.open(buyUrl, '_blank');
  };

  const handleLaunchApp = () => {
    window.location.href = '/chat';
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-orange-500/20 filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-orange-600/15 filter blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-orange-400/10 filter blur-3xl animate-pulse" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="container mx-auto text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
            Ready to chat with your blockchain?
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
            Join thousands of users already using Tikka to navigate Solana with confidence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleBuyToken}
              rightIcon={<ExternalLink className="w-5 h-5" />}
            >
              Buy $CHAT
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleLaunchApp}
              rightIcon={<Rocket className="w-5 h-5" />}
            >
              Launch Tikka Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
