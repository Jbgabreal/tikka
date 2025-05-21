
import React from "react";
import { MessageSquare, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const ChatSidebar = () => {
  return (
    <div className="w-64 border-r border-chatta-purple/10 h-screen flex flex-col bg-chatta-darker">
      <div className="p-4 border-b border-chatta-purple/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-chatta-purple to-chatta-cyan"></div>
          <h1 className="gradient-text text-2xl font-bold">Chatta</h1>
        </div>
      </div>
      
      <nav className="flex-grow p-4">
        <ul className="space-y-2">
          {[
            { icon: MessageSquare, label: "Chat", active: true },
            { icon: History, label: "History" },
            { icon: Settings, label: "Settings" },
          ].map((item, index) => (
            <li key={index}>
              <a 
                href="#" 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  item.active 
                    ? "bg-chatta-purple/10 text-chatta-purple" 
                    : "text-gray-400 hover:bg-chatta-purple/5 hover:text-gray-300"
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-chatta-purple/10">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-6 h-6 rounded-full bg-chatta-gray/20"></div>
          <span>Connected Wallet</span>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
