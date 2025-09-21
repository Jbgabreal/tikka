
import React from "react";
import { MessageSquare, BarChart3, ArrowLeftRight } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "You ask",
      description: "What's trending on Solana?",
      color: "from-orange-500 to-pink-500"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Chatta replies",
      description: "Real-time blockchain data",
      color: "from-orange-500 to-pink-500"
    },
    {
      icon: <ArrowLeftRight className="w-8 h-8" />,
      title: "You act",
      description: "Make informed decisions",
      color: "from-orange-500 to-pink-500"
    }
  ];

  return (
    <section className="py-32 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 gradient-text">
            How Chatta Works
        </h2>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Interact with Solana through natural conversation. No complex interfaces, just simple commands that get things done.
        </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
          {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step Number */}
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {index + 1}
                </div>
                
                {/* Card */}
                <div className="neo-card p-10 lg:p-12 rounded-3xl hover:scale-105 transition-all duration-500 group">
                  <div className={`w-24 h-24 lg:w-28 lg:h-28 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                  {step.icon}
                </div>
              </div>
                  
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xl text-center leading-relaxed">
                    {step.description}
                  </p>
                </div>
                
                {/* Connection Arrow */}
              {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-8 transform -translate-y-1/2">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <ArrowLeftRight className="w-6 h-6 text-white" />
                    </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
    </section>
  );
};

export default HowItWorks;
