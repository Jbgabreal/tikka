
import React from "react";
import { MessageSquare, ArrowLeftRight, BarChart3, Zap } from "lucide-react";

const FeaturesGrid = () => {
  const features = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Natural Language Chat",
      description: "Ask questions in plain English and get instant, accurate responses powered by advanced AI."
    },
    {
      icon: <ArrowLeftRight className="w-8 h-8" />,
      title: "Token Swaps & DeFi Commands",
      description: "Execute complex DeFi operations with simple commands. Swap tokens, provide liquidity, and more."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Real-Time Portfolio Visualization",
      description: "Track your portfolio performance with live charts and detailed analytics."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Blockchain Execution",
      description: "Execute transactions instantly with optimized gas fees and smart routing."
    }
  ];

  return (
    <section className="py-32 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 gradient-text">
            Key Features
        </h2>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Everything you need to navigate Solana with confidence, powered by advanced AI and real-time blockchain data.
        </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div 
              key={index}
                className="neo-card p-8 lg:p-10 rounded-3xl hover:scale-105 transition-all duration-500 group"
            >
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <div className="text-white">
                  {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                  {feature.description}
                </p>
            </div>
          ))}
        </div>
      </div>
    </div>
    </section>
  );
};

export default FeaturesGrid;
