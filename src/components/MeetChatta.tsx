
import React, { useState } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  ArrowRight, 
  Rocket, 
  TrendingUp, 
  ChartBar
} from "lucide-react";

const MeetChatta = () => {
  // Default show first accordion item open
  const [openItem, setOpenItem] = useState("item-0");
  
  // Sample chat interaction
  const chatSample = [
    { 
      user: "Swap 5 SOL to BONK", 
      response: "I found the best route for your swap:\n\n5 SOL ≈ 13,245,678 BONK\nRoute: Jupiter Aggregator\nSlippage: 0.5%\nPrice impact: 0.12%\n\nReady to execute?"
    }
  ];

  // Capabilities list for the accordion
  const capabilities = [
    {
      id: "item-0",
      title: "Swap with Speed",
      icon: <ArrowRight className="w-5 h-5 text-chatta-cyan" />,
      description: "Just type your trade and it executes instantly on Solana. No complex interfaces or confusing charts—tell Chatta what you want and it handles the rest."
    },
    {
      id: "item-1",
      title: "Launch a Token",
      icon: <Rocket className="w-5 h-5 text-chatta-purple" />,
      description: "Create meme tokens or utilities in seconds. Chatta guides you through tokenomics, distribution, and listing—all through simple conversation."
    },
    {
      id: "item-2",
      title: "Analyze Portfolios",
      icon: <ChartBar className="w-5 h-5 text-chatta-cyan" />,
      description: "Get live performance metrics and risk breakdowns. Understand your positions at a glance with natural language summaries and actionable insights."
    },
    {
      id: "item-3",
      title: "Track Market Sentiment",
      icon: <TrendingUp className="w-5 h-5 text-chatta-purple" />,
      description: "Scan trending tokens, wallet flows, and social momentum. Chatta monitors on-chain activity and social signals to keep you ahead of market movements."
    }
  ];

  return (
    <div className="py-20 bg-chatta-dark relative">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-chatta-purple/10 filter blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full bg-chatta-cyan/10 filter blur-2xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Meet <span className="gradient-text">Chatta</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Your AI assistant for Solana — built to launch tokens, analyze sentiment, 
            and execute trades in seconds.
          </p>
        </div>
        
        {/* Two column layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left column - Phone mockup */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative w-[280px] max-w-full animate-float">
              {/* Phone frame */}
              <div className="rounded-[40px] bg-chatta-darker border border-gray-800 p-3 shadow-xl shadow-chatta-purple/20">
                {/* Phone screen */}
                <div className="rounded-[32px] bg-chatta-dark border border-gray-700 overflow-hidden">
                  {/* Status bar */}
                  <div className="h-6 bg-black/30 flex items-center justify-between px-4">
                    <div className="text-xs text-gray-400">9:41</div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-chatta-cyan"></div>
                      <div className="h-2 w-2 rounded-full bg-chatta-purple"></div>
                    </div>
                  </div>
                  
                  {/* Chat content */}
                  <div className="p-4 h-[480px]">
                    <div className="text-xs text-gray-500 text-center mb-4">Today, 4:20 PM</div>
                    
                    {/* User message */}
                    <div className="flex justify-end mb-3">
                      <div className="bg-chatta-purple/30 rounded-xl rounded-tr-sm p-3 max-w-[80%]">
                        <p className="text-sm">{chatSample[0].user}</p>
                      </div>
                    </div>
                    
                    {/* Bot response */}
                    <div className="flex justify-start mb-3">
                      <div className="bg-gray-800/50 rounded-xl rounded-tl-sm p-3 max-w-[80%]">
                        <p className="text-sm whitespace-pre-wrap">{chatSample[0].response}</p>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4">
                      <button className="bg-chatta-purple text-white text-xs rounded-full px-3 py-1.5 flex-1">
                        Execute Swap
                      </button>
                      <button className="bg-gray-800 text-gray-300 text-xs rounded-full px-3 py-1.5 flex-1">
                        Modify
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Glow effect under phone */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-[180px] h-10 bg-chatta-purple/20 filter blur-xl rounded-full"></div>
            </div>
          </div>
          
          {/* Right column - Accordion */}
          <div className="w-full lg:w-1/2">
            <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem} className="w-full">
              {capabilities.map((capability, index) => (
                <AccordionItem 
                  key={capability.id} 
                  value={capability.id}
                  className="border-gray-700 hover:bg-gray-900/20 transition-colors rounded-md my-2"
                >
                  <AccordionTrigger className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {capability.icon}
                      <span className="text-lg">{capability.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-gray-400">
                    {capability.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetChatta;
