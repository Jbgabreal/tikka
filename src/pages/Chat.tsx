
import React, { useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PureMultimodalInput } from "@/components/ui/multimodal-ai-chat-input";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

interface Attachment {
  url: string;
  name: string;
  contentType: string;
  size: number;
}

interface UIMessage {
  id: string;
  content: string;
  role: string;
  attachments?: Attachment[];
}

// Quick command options
const quickCommands = [
  { label: "Swap Tokens", action: "swap" },
  { label: "Launch Token", action: "launch" },
  { label: "Analyze Portfolio", action: "analyze" },
  { label: "Check Market", action: "market" },
];

const Chat = () => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatId] = useState('main-chat');
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // For responsive design
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setShowSidebar(window.innerWidth >= 768);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = useCallback(({ input, attachments }: { input: string; attachments: Attachment[] }) => {
    // Add user message to the messages array
    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      content: input,
      role: 'user',
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate AI responding
    setIsGenerating(true);
    
    setTimeout(() => {
      // Add AI response
      const aiMessage: UIMessage = {
        id: `ai-${Date.now()}`,
        content: `This is a simulated response to: "${input}"`,
        role: 'assistant',
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsGenerating(false);
    }, 1500);
    
  }, []);

  const handleStopGenerating = useCallback(() => {
    console.log("Stopped generating");
    setIsGenerating(false);
  }, []);

  const handleQuickCommand = useCallback((command: string) => {
    let commandMessage = "";
    
    switch(command) {
      case "swap":
        commandMessage = "I want to swap SOL to USDC";
        break;
      case "launch":
        commandMessage = "Help me launch a new token on Solana";
        break;
      case "analyze":
        commandMessage = "Analyze my Solana portfolio";
        break;
      case "market":
        commandMessage = "What's happening in the Solana market today?";
        break;
      default:
        commandMessage = command;
    }
    
    handleSendMessage({ 
      input: commandMessage, 
      attachments: [] 
    });
  }, [handleSendMessage]);

  const handleConnectWallet = () => {
    // Simulate wallet connection
    console.log("Connecting wallet...");
    setTimeout(() => {
      const mockWalletAddress = "8xF2...k9J3";
      setWalletConnected(true);
      setWalletAddress(mockWalletAddress);
      console.log("Wallet connected:", mockWalletAddress);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-chatta-dark text-white">
      <div className="mx-auto max-w-[1200px] flex relative">
        {/* Mobile Sidebar Toggle */}
        {isMobile && (
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="fixed top-4 left-4 z-50 rounded-full bg-chatta-purple/20 p-2"
          >
            <div className="w-6 h-0.5 bg-white mb-1"></div>
            <div className="w-6 h-0.5 bg-white mb-1"></div>
            <div className="w-6 h-0.5 bg-white"></div>
          </button>
        )}
        
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ x: isMobile ? -260 : 0, opacity: isMobile ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "fixed md:relative z-40 md:z-auto", 
                isMobile ? "inset-y-0 left-0 shadow-lg" : ""
              )}
            >
              <ChatSidebar 
                onClose={isMobile ? () => setShowSidebar(false) : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-[260px]">
          {/* Header with wallet connection */}
          <div className="border-b border-chatta-purple/10 p-4 flex items-center justify-between">
            <h1 className="text-xl font-medium">Chat with Chatta</h1>
            {walletConnected ? (
              <div className="flex items-center gap-2 bg-chatta-purple/10 px-3 py-1 rounded-full border border-chatta-purple/20">
                <div className="w-2 h-2 rounded-full bg-chatta-cyan"></div>
                <span className="text-sm text-gray-300">Wallet: {walletAddress}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Connect to continue</span>
              </div>
            )}
          </div>
          
          {/* Conditional content based on wallet connection */}
          {walletConnected ? (
            <>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-[800px] mx-auto w-full">
                <AnimatePresence>
                  {messages.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center gap-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-chatta-purple to-chatta-cyan flex items-center justify-center">
                        <span className="text-2xl">👋</span>
                      </div>
                      <h2 className="text-2xl font-bold gradient-text">Welcome to Chatta</h2>
                      <p className="text-gray-400 max-w-md">
                        Your AI assistant for Solana. Ask me to swap tokens, launch a project, or analyze your portfolio.
                      </p>
                    </motion.div>
                  ) : (
                    messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className={`flex mb-6 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role !== 'user' && (
                          <Avatar className="h-8 w-8 mr-3 mt-1">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-gradient-to-br from-chatta-purple to-chatta-cyan text-white">CH</AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
                          <div 
                            className={cn(
                              "px-4 py-2 rounded-2xl",
                              message.role === 'user' 
                                ? "bg-chatta-darker border border-white/10" 
                                : "bg-chatta-purple/20 border border-chatta-purple/30"
                            )}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {message.attachments.map((attachment) => (
                                  <Badge 
                                    key={attachment.url} 
                                    className="bg-chatta-darker text-gray-300 border border-gray-700"
                                  >
                                    {attachment.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div 
                            className={`text-xs text-gray-500 mt-1 ${
                              message.role === 'user' ? 'text-right' : 'text-left'
                            }`}
                          >
                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        
                        {message.role === 'user' && (
                          <Avatar className="h-8 w-8 ml-3 mt-1 order-2">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-gray-700 text-gray-300">U</AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
                
                {/* Typing indicator */}
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-gray-400 mb-4"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-chatta-purple to-chatta-cyan text-white">CH</AvatarFallback>
                    </Avatar>
                    <div className="flex px-3 py-2 bg-chatta-purple/10 rounded-2xl">
                      <span className="animate-pulse mr-1">●</span>
                      <span className="animate-pulse animation-delay-200 mr-1">●</span>
                      <span className="animate-pulse animation-delay-400">●</span>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Quick commands */}
              <div className="px-4 pt-2 max-w-[800px] mx-auto w-full">
                <div className="flex flex-wrap gap-2">
                  {quickCommands.map((cmd) => (
                    <button
                      key={cmd.action}
                      onClick={() => handleQuickCommand(cmd.action)}
                      className="text-sm px-3 py-1 rounded-full 
                        bg-chatta-purple/10 border border-chatta-purple/30 
                        hover:bg-chatta-purple/20 transition-all 
                        focus:outline-none focus:ring-2 focus:ring-chatta-purple/50"
                    >
                      {cmd.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Input area */}
              <div className="p-4 max-w-[800px] mx-auto w-full">
                <PureMultimodalInput 
                  chatId={chatId}
                  messages={messages}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  onSendMessage={handleSendMessage}
                  onStopGenerating={handleStopGenerating}
                  isGenerating={isGenerating}
                  canSend={true}
                  selectedVisibilityType="private"
                  className="bg-chatta-darker border-chatta-purple/20 focus-within:border-chatta-purple/50 focus-within:glow-sm"
                />
              </div>
            </>
          ) : (
            /* Wallet Connect UI */
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md px-4"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-chatta-purple to-chatta-cyan flex items-center justify-center">
                  <Wallet size={36} className="text-white" />
                </div>
                
                <h2 className="text-2xl font-bold gradient-text mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400 mb-8">
                  To access Chatta's AI assistant for Solana, please connect your wallet to continue.
                </p>
                
                <Button 
                  onClick={handleConnectWallet}
                  className="bg-chatta-purple hover:bg-chatta-purple/90 text-white py-3 px-6 rounded-lg glow font-medium"
                >
                  <Wallet className="mr-2" size={18} />
                  Connect Wallet
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
