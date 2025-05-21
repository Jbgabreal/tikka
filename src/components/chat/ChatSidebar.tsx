
import React, { useEffect } from "react";
import { MessageSquare, History, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface ChatSidebarProps {
  onClose?: () => void;
}

const ChatSidebar = ({ onClose }: ChatSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  
  // Debug logs for component lifecycle and current path
  useEffect(() => {
    console.log("ChatSidebar mounted");
    console.log("Current path:", path);
    console.log("Full location object:", location);
    console.log("Navigate function available:", !!navigate);
    console.log("onClose function available:", !!onClose);
    
    return () => {
      console.log("ChatSidebar unmounted");
    };
  }, [path, location, navigate, onClose]);
  
  // Define navigation items
  const navItems = [
    { icon: MessageSquare, label: "Chat", route: "/chat", active: path === "/chat" },
    { icon: History, label: "History", route: "/chat?history=true", active: path.includes("history") },
    { icon: Settings, label: "Settings", route: "/settings", active: path === "/settings" },
  ];

  // Function to handle closing sidebar
  const handleClose = () => {
    console.log("Sidebar close handler called");
    if (onClose) {
      console.log("Executing onClose function");
      onClose();
    }
  };
  
  // Updated link click handler with explicit event parameter
  const handleLinkClick = (route: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default Link behavior
    e.stopPropagation(); // Stop event bubbling
    
    console.log(`Link clicked for route: ${route}`);
    console.log("Current path before navigation:", path);
    
    // Call onClose before navigation if available
    if (onClose) {
      console.log("Closing sidebar before navigation");
      onClose();
    }
    
    // Use a slight delay to allow sidebar to close first
    setTimeout(() => {
      console.log("Navigating to:", route);
      navigate(route);
    }, 50);
  };
  
  // Handle recent chat click
  const handleRecentChatClick = (chatName: string, e: React.MouseEvent) => {
    e.preventDefault();
    console.log(`Recent chat clicked: ${chatName}`);
    
    // Call onClose if available
    if (onClose) {
      console.log("Closing sidebar after recent chat click");
      onClose();
    }
    
    // Navigate to the chat page
    setTimeout(() => {
      navigate("/chat");
    }, 50);
  };
  
  // Handle new chat button click
  const handleNewChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("New Chat button clicked");
    
    // Call onClose if available
    if (onClose) {
      console.log("Closing sidebar after new chat click");
      onClose();
    }
    
    // Navigate to the chat page
    setTimeout(() => {
      navigate("/chat");
    }, 50);
  };
  
  // Handle logo click
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Logo link clicked, navigating to /");
    
    // Call onClose if available
    if (onClose) {
      console.log("Closing sidebar after logo click");
      onClose();
    }
    
    // Navigate to the home page
    setTimeout(() => {
      navigate("/");
    }, 50);
  };
  
  console.log("Rendering ChatSidebar with path:", path);
  console.log("onClose prop exists:", !!onClose);
  
  return (
    <div className="w-[260px] border-r border-chatta-purple/20 h-screen flex flex-col bg-gradient-to-b from-chatta-darker to-chatta-dark">
      {/* Header with logo */}
      <div className="p-4 border-b border-chatta-purple/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a 
              href="/"
              onClick={(e) => handleLogoClick(e)}
              className="cursor-pointer"
            >
              <img src="/lovable-uploads/4e3faff9-aeeb-4667-84fe-6c0002c1fca1.png" alt="Chatta" className="h-9" />
            </a>
          </div>
          
          {onClose && (
            <button 
              onClick={() => {
                console.log("Close button clicked");
                handleClose();
              }}
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
              <a
                href={item.route}
                onClick={(e) => handleLinkClick(item.route, e)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all cursor-pointer",
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
              <a
                href="/chat"
                onClick={(e) => handleRecentChatClick(chat, e)}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-2 px-2 py-1.5 rounded hover:bg-chatta-purple/10 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-chatta-cyan"></span>
                {chat}
              </a>
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
          <a 
            href="/chat" 
            onClick={(e) => handleNewChatClick(e)}
          >
            New Chat
          </a>
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
