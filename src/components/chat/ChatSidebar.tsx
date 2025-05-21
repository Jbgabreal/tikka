
import React from "react";
import { MessageSquare, History, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

interface ChatSidebarProps {
  onClose?: () => void;
}

const ChatSidebar = ({ onClose }: ChatSidebarProps) => {
  const location = useLocation();
  const path = location.pathname;
  
  // Define navigation items
  const navItems = [
    { icon: MessageSquare, label: "Chat", route: "/chat", active: path === "/chat" },
    { icon: History, label: "History", route: "/chat?history=true", active: path.includes("history") },
    { icon: Settings, label: "Settings", route: "/settings", active: path === "/settings" },
  ];
  
  return (
    <div className="w-[260px] border-r border-chatta-purple/20 h-screen flex flex-col bg-gradient-to-b from-chatta-darker to-chatta-dark">
      {/* Header with logo */}
      <div className="p-4 border-b border-chatta-purple/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link 
              to="/"
              onClick={onClose}
              className="cursor-pointer"
            >
              <img src="/lovable-uploads/4e3faff9-aeeb-4667-84fe-6c0002c1fca1.png" alt="Chatta" className="h-9" />
            </Link>
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
          {navItems.map((item, index) => (
            <motion.li 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Link
                to={item.route}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all cursor-pointer",
                  item.active 
                    ? "bg-chatta-purple/20 text-white border border-chatta-purple/30 glow-sm" 
                    : "text-gray-400 hover:bg-chatta-purple/10 hover:text-gray-200"
                )}
              >
                <item.icon size={18} className={item.active ? "text-chatta-purple" : ""} />
                <span>{item.label}</span>
              </Link>
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
              <Link
                to="/chat"
                onClick={onClose}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1.5 rounded hover:bg-chatta-purple/10 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-chatta-cyan"></span>
                {chat}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-chatta-purple/20">
        <Button 
          variant="chatta" 
          className="w-full text-sm font-medium"
          asChild
        >
          <Link to="/chat" onClick={onClose}>
            New Chat
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
