
import React from "react";

const ChatPreview = () => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-xl glow">
      <div className="bg-chatta-purple/20 p-3 flex items-center">
        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
        <div className="flex-1 text-center text-sm font-medium text-gray-300">Chatta AI</div>
      </div>
      <div className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-end">
            <div className="bg-chatta-purple/30 rounded-2xl rounded-tr-none px-4 py-2 max-w-xs">
              <p className="text-white">What's the price of $BONK?</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-2 max-w-xs">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <p className="text-xs text-gray-400">Chatta is thinking...</p>
              </div>
              <p className="text-white">$BONK is currently trading at $0.00002631, up 3.8% in the last 24h with a market cap of $156.4M.</p>
              <div className="mt-2 flex items-center">
                <div className="h-6 w-12 bg-gradient-to-r from-green-600 to-green-400 rounded mr-2"></div>
                <span className="text-green-400 text-sm">+3.8%</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-chatta-purple/30 rounded-2xl rounded-tr-none px-4 py-2 max-w-xs">
              <p className="text-white">Swap 1 SOL to BONK</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-2 max-w-xs">
              <p className="text-white">Processing your swap of 1 SOL to ~38,000,000 BONK at market rate...</p>
              <div className="mt-2 p-2 rounded bg-black/30 border border-chatta-purple/30">
                <div className="flex justify-between text-xs mb-1">
                  <span>From</span>
                  <span>1 SOL</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>To (estimated)</span>
                  <span>38,000,000 BONK</span>
                </div>
                <div className="mt-2 w-full h-1 bg-gray-700 rounded overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-chatta-purple to-chatta-cyan animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPreview;
