
import React from "react";
import { MessageCircle, BarChart2, Swap } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <MessageCircle className="w-8 h-8 text-chatta-purple" />,
      title: "You ask",
      description: "What's trending on Solana?",
      detail: "Simply ask Chatta anything about Solana in natural language"
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-chatta-cyan" />,
      title: "Chatta replies",
      description: "Real-time blockchain data",
      detail: "Get instant access to prices, trends, and on-chain activities"
    },
    {
      icon: <Swap className="w-8 h-8 text-chatta-purple" />,
      title: "You act",
      description: "Make informed decisions",
      detail: "Swap tokens, manage your portfolio, or explore opportunities"
    }
  ];

  return (
    <div className="py-24 bg-chatta-darker">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          How <span className="gradient-text">Chatta</span> Works
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
          Experience the simplicity of interacting with Solana through natural conversation.
          No complex interfaces, just chat.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="glass-card rounded-xl p-6 hover:scale-105 transition-transform duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-chatta-purple/10 to-chatta-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">{step.title}</h3>
              <p className="text-chatta-cyan font-medium mb-4 text-center">{step.description}</p>
              <p className="text-gray-400 text-center">{step.detail}</p>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute -right-5 top-1/3 transform translate-x-full">
                  <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M39.0607 13.0607C39.6464 12.4749 39.6464 11.5251 39.0607 10.9393L29.5147 1.3934C28.9289 0.807611 27.9792 0.807611 27.3934 1.3934C26.8076 1.97919 26.8076 2.92893 27.3934 3.51472L35.8787 12L27.3934 20.4853C26.8076 21.0711 26.8076 22.0208 27.3934 22.6066C27.9792 23.1924 28.9289 23.1924 29.5147 22.6066L39.0607 13.0607ZM0 13.5H38V10.5H0V13.5Z" fill="#9334ea"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
