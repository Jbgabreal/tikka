
import React from "react";
import { MessageSquare, ArrowLeftRight, BarChart2, Search } from "lucide-react";

const FeaturesGrid = () => {
  const features = [
    {
      icon: <MessageSquare className="w-10 h-10 text-chatta-cyan" />,
      title: "Natural Language Interface",
      description: "Chat naturally with Chatta as you would with a friend. No complex commands required."
    },
    {
      icon: <ArrowLeftRight className="w-10 h-10 text-chatta-purple" />,
      title: "Smart Token Swaps",
      description: "Instantly swap tokens through conversation. Chatta finds the best routes and rates."
    },
    {
      icon: <BarChart2 className="w-10 h-10 text-chatta-cyan" />,
      title: "Live Portfolio View",
      description: "Track your assets, monitor performance, and analyze investment opportunities."
    },
    {
      icon: <Search className="w-10 h-10 text-chatta-purple" />,
      title: "AI-Powered Insights",
      description: "Receive intelligent recommendations based on market trends and your activity."
    }
  ];

  return (
    <div className="py-24 bg-chatta-dark relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          Core <span className="gradient-text">Features</span>
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
          Everything you need to navigate Solana with confidence,
          powered by advanced AI and real-time data.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass-card gradient-border p-6 hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesGrid;
