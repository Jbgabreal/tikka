
import React from "react";
import { Button } from "@/components/ui/button";

const CtaSection = () => {
  return (
    <div className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-chatta-purple to-chatta-cyan opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 gradient-text">
            Ready to chat with your blockchain?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already trading, tracking, and exploring Solana 
            with the power of AI conversation.
          </p>
          <Button
            variant="chatta-gradient"
            size="chatta"
            className="text-lg font-bold py-6 min-w-[200px]"
          >
            Launch Chatta Now
          </Button>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-chatta-purple opacity-20 filter blur-3xl"></div>
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-chatta-cyan opacity-20 filter blur-3xl"></div>
    </div>
  );
};

export default CtaSection;
