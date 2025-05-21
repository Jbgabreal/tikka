
import React from "react";
import { MessageSquare, History, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ChatSidebarProps {
  onClose?: () => void;
}

const ChatSidebar = ({ onClose }: ChatSidebarProps) => {
  return (
    <div className="w-[260px] border-r border-chatta-purple/20 h-screen flex flex-col bg-gradient-to-b from-chatta-darker to-chatta-dark">
      {/* Header with logo */}
      <div className="p-4 border-b border-chatta-purple/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-chatta-purple to-chatta-cyan flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <h1 className="gradient-text text-2xl font-bold">Chatta</h1>
          </div>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-grow p-4">
        <ul className="space-y-1">
          {[
            { icon: MessageSquare, label: "Chat", active: true },
            { icon: History, label: "History" },
            { icon: Settings, label: "Settings" },
          ].map((item, index) => (
            <motion.li 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <a 
                href="#" 
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all",
                  item.active 
                    ? "bg-chatta-purple/20 text-white border border-chatta-purple/30 glow-sm" 
                    : "text-gray-400 hover:bg-chatta-purple/10 hover:text-gray-200"
                )}
              >
                <item.icon size={18} className={item.active ? "text-chatta-purple" : ""} />
                <span>{item.label}</span>
              </a>
            </motion.li>
          ))}
        </ul>
      </nav>
      
      {/* New Chats section */}
      <div className="p-4 border-t border-chatta-purple/20">
        <h3 className="text-xs uppercase text-gray-500 font-medium mb-2">Recent Chats</h3>
        <ul className="space-y-1">
          {[
            "Token Analysis",
            "Portfolio Review"
          ].map((chat, index) => (
            <li key={index}>
              <a href="#" className="text-gray-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1.5 rounded hover:bg-chatta-purple/10">
                <span className="w-1.5 h-1.5 rounded-full bg-chatta-cyan"></span>
                {chat}
              </a>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-chatta-purple/20">
        <button className="w-full py-2 rounded-lg bg-chatta-purple hover:bg-chatta-purple/90 text-sm font-medium">
          New Chat
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
