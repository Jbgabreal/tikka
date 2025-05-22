import React, { useState, useCallback, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PureMultimodalInput } from "@/components/ui/multimodal-ai-chat-input";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Wallet, Copy, Clipboard, CheckCircle, AlertTriangle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { sendChatMessage } from "@/services/api";
import { VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

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

// Quick command options - updated to match the suggested prompts
const quickCommands = [
  { label: "Swap $SOL to $BONK", action: "swap" },
  { label: "Launch BONKAI", action: "launch" },
  { label: "Trending on Solana", action: "trending" },
  { label: "My Portfolio", action: "portfolio" },
];

// Background ambient dot animation
const AmbientBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#12121a,_#0a090e)]">
        {/* Ambient dots */}
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-chatta-purple/5"
            style={{
              width: `${Math.random() * 10 + 3}px`,
              height: `${Math.random() * 10 + 3}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.3
            }}
          />
        ))}
      </div>
      
      {/* Subtle glow in top-left */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-chatta-purple/10 blur-[100px] rounded-full" />
      
      {/* Secondary glow */}
      <div className="absolute top-1/3 right-0 w-72 h-72 bg-chatta-cyan/5 blur-[80px] rounded-full" />
    </div>
  );
};

const Chat = () => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatId] = useState('main-chat');
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const location = useLocation();
  const { setVisible } = useWalletModal();
  const { publicKey, connected, disconnect, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | undefined>(undefined);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [unsignedTx, setUnsignedTx] = useState<string | null>(null);
  const [pendingMint, setPendingMint] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Debug logs
  useEffect(() => {
    console.log("Chat component mounted");
    console.log("Current location:", location);
    
    return () => {
      console.log("Chat component unmounted");
    };
  }, [location]);

  // Debug sidebar state
  useEffect(() => {
    console.log("Sidebar visibility state:", showSidebar);
  }, [showSidebar]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSignAndSend = useCallback(async () => {
    if (!unsignedTx) return;
    try {
      const txBuffer = Buffer.from(unsignedTx, 'base64');
      const tx = VersionedTransaction.deserialize(txBuffer);
      const signature = await sendTransaction(tx, connection);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          content: `🎉 Token created successfully!\n${pendingMint ? `Mint: ${pendingMint}\n` : ''}[SOLSCAN_LINK]${signature}[/SOLSCAN_LINK]`,
          role: 'assistant',
        }
      ]);
      setUnsignedTx(null);
      setPendingMint(null);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        content: `❌ Failed to sign/send transaction: ${e.message}`,
        role: 'assistant',
      }]);
    }
  }, [unsignedTx, signTransaction, sendTransaction, connection, pendingMint]);

  const handleSendMessage = useCallback(async ({ input, attachments }: { input: string; attachments: Attachment[] }) => {
    // For the 'image' step, only send if an image is attached, and do NOT add a user message to chat history
    if (currentStep === 'image') {
      if (!attachments.length) return; // Don't send if no image
      // Add a user message with the image attachment
      const userMessage: UIMessage = {
        id: `user-${Date.now()}`,
        content: '',
        role: 'user',
        attachments: [...attachments],
      };
      setMessages(prev => [...prev, userMessage]);
      setIsGenerating(true);
      try {
        const response = await sendChatMessage('', {
          messages,
          attachments,
          currentStep, // Pass currentStep so API knows to use file upload
          walletAddress: publicKey?.toBase58(), // Pass wallet address for backend session
        });
        console.log('[DEBUG] Backend response (image step):', response);
        if (response.prompt && typeof response.step !== 'undefined') {
          setMessages(prev => [...prev, {
            id: `ai-${Date.now()}`,
            content: response.prompt,
            role: 'assistant',
          }]);
          setCurrentStep(response.step); // This can be null (flow done) or a string (next step)
        } else if (typeof response.step !== 'undefined') {
          setCurrentStep(response.step);
        } else {
          // Only exit the flow if backend says step is null
          if (currentStep !== undefined) {
            setMessages(prev => [...prev, {
              id: `ai-${Date.now()}`,
              content: 'Unexpected response, please try again.',
              role: 'assistant',
            }]);
            // Do NOT setCurrentStep(undefined) here!
          } else {
            setCurrentStep(undefined);
          }
        }
      } catch (e) {
        setMessages(prev => [...prev, { id: `err-${Date.now()}`, content: 'Error contacting backend', role: 'assistant' }]);
      }
      setIsGenerating(false);
      // Focus the chat input after sending
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
      return;
    }
    // For all other token creation steps, include walletAddress and currentStep in context
    if (currentStep) {
      if (!input.trim()) return; // Don't send empty text
      const userMessage: UIMessage = {
        id: `user-${Date.now()}`,
        content: input,
        role: 'user',
        attachments: attachments.length > 0 ? [...attachments] : undefined,
      };
      setMessages(prev => [...prev, userMessage]);
      setIsGenerating(true);
      try {
        const response = await sendChatMessage(input, {
          messages,
          currentStep,
          walletAddress: publicKey?.toBase58(),
        });
        console.log('[DEBUG] Backend response:', response);
        if (response.result?.unsignedTransaction) {
          setUnsignedTx(response.result.unsignedTransaction);
          setPendingMint(response.result.mint || null);
          setMessages(prev => [...prev, {
            id: `ai-${Date.now()}`,
            content: `🚀 Unsigned transaction generated! Please sign with your wallet to complete token creation.`,
            role: 'assistant',
          }]);
          setCurrentStep(undefined);
          return;
        } else if (response.prompt && typeof response.step !== 'undefined') {
          setMessages(prev => [...prev, {
            id: `ai-${Date.now()}`,
            content: response.prompt,
            role: 'assistant',
          }]);
          setCurrentStep(response.step);
        } else if (typeof response.step !== 'undefined') {
          setCurrentStep(response.step);
        } else {
          if (currentStep !== undefined) {
            setMessages(prev => [...prev, {
              id: `ai-${Date.now()}`,
              content: 'Unexpected response, please try again.',
              role: 'assistant',
            }]);
          } else {
            setCurrentStep(undefined);
          }
        }
      } catch (e) {
        setMessages(prev => [...prev, { id: `err-${Date.now()}`, content: 'Error contacting backend', role: 'assistant' }]);
      }
      setIsGenerating(false);
      // Focus the chat input after sending
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
      return;
    }
    // For all other (non-token-creation) messages
    if (!input.trim()) return; // Don't send empty text
    const userMessage: UIMessage = {
      id: `user-${Date.now()}`,
      content: input,
      role: 'user',
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    try {
      const response = await sendChatMessage(input, { messages });
      console.log('[DEBUG] Backend response:', response);
      if (response.prompt && typeof response.step !== 'undefined') {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          content: response.prompt,
          role: 'assistant',
        }]);
        setCurrentStep(response.step);
      } else if (typeof response.step !== 'undefined') {
        setCurrentStep(response.step);
      } else {
        if (currentStep !== undefined) {
          setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
            content: 'Unexpected response, please try again.',
        role: 'assistant',
          }]);
        } else {
          setCurrentStep(undefined);
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, content: 'Error contacting backend', role: 'assistant' }]);
    }
      setIsGenerating(false);
    // Focus the chat input after sending
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [messages, currentStep, publicKey]);

  const handleStopGenerating = useCallback(() => {
    console.log("Stopped generating");
    setIsGenerating(false);
  }, []);

  const handleQuickCommand = useCallback((command: string) => {
    console.log("Quick command selected:", command);
    
    let commandMessage = "";
    
    switch(command) {
      case "swap":
        commandMessage = "Swap 5 $SOL to $BONK";
        break;
      case "launch":
        commandMessage = "Launch a meme token called BONKAI";
        break;
      case "trending":
        commandMessage = "What's trending on Solana right now?";
        break;
      case "portfolio":
        commandMessage = "Show my portfolio";
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
    setVisible(true);
  };

  const handleToggleSidebar = () => {
    console.log("Toggling sidebar from", showSidebar, "to", !showSidebar);
    setShowSidebar(!showSidebar);
  };

  const handleCloseSidebar = useCallback(() => {
    console.log("Closing sidebar from ChatSidebar onClose callback");
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [isMobile]);

  // For responsive design
  React.useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      
      // Only update showSidebar if the mobile state changes
      if (newIsMobile !== isMobile) {
        console.log("Mobile state changed:", newIsMobile);
        setShowSidebar(window.innerWidth >= 768);
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  console.log("Rendering Chat component, showSidebar:", showSidebar, "isMobile:", isMobile);

  return (
    <div className="flex min-h-screen bg-chatta-darker overflow-hidden relative">
      {/* Background with ambient effects */}
      <AmbientBackground />

      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <button 
          onClick={handleToggleSidebar}
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
            className="fixed md:relative z-40 md:z-auto h-full"
            style={{ width: '260px' }}
          >
            <ChatSidebar 
              onClose={handleCloseSidebar}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Chat Area - Centered relative to the page width */}
      <div className="fixed inset-0 flex justify-center">
        {/* Offset sidebar space on non-mobile */}
        <div className={cn(
          "hidden md:block",
          showSidebar ? "w-[260px]" : "w-0"
        )}></div>
        
        {/* Main content container */}
        <div className="w-full max-w-[720px] flex flex-col h-screen bg-gradient-to-b from-black/5 to-transparent backdrop-blur-sm relative z-10">
          {/* Header with wallet connection */}
          <div className="border-b border-chatta-purple/10 p-4 flex items-center justify-end">
            {connected ? (
              <div className="flex items-center gap-2 bg-chatta-purple/10 px-3 py-1 rounded-full border border-chatta-purple/20">
                <div className="w-2 h-2 rounded-full bg-chatta-cyan"></div>
                <span className="text-sm text-gray-300 flex items-center gap-1">
                  Wallet: {publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : ""}
                  <button
                    onClick={() => {
                      if (publicKey) {
                        navigator.clipboard.writeText(publicKey.toBase58());
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1200);
                      }
                    }}
                    className="ml-1 p-1 rounded hover:bg-chatta-purple/20 transition-colors"
                    title="Copy address"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={async () => {
                      await disconnect();
                      setVisible(true);
                    }}
                    className="ml-1 px-2 py-1 rounded bg-chatta-purple/20 hover:bg-chatta-purple/40 text-xs transition-colors"
                    title="To use a different Phantom account, disconnect, switch accounts in Phantom, then reconnect."
                  >
                    Change
                  </button>
                  {copied && <span className="ml-1 text-xs text-green-400">Copied!</span>}
                </span>
              </div>
            ) : (
              <Button
                onClick={handleConnectWallet}
                variant="chatta"
                size="chatta"
                className="text-sm"
              >
                <Wallet className="mr-2" size={16} />
                Connect Wallet
              </Button>
            )}
          </div>
          
          {/* Conditional content based on wallet connection */}
          {connected ? (
            <div className="flex-1 flex flex-col overflow-hidden neo-blur">
              {/* Messages area with centered content */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
                <AnimatePresence>
                  {messages.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center gap-4 py-12 relative"
                    >
                      {/* Accent glow behind welcome message */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-chatta-purple/5 rounded-full blur-3xl" />
                      
                      <img src="/lovable-uploads/ac4cd6a8-b121-475a-9021-d930c27581e3.png" alt="Chatta" className="h-16 relative z-10" />
                      <h2 className="text-2xl font-bold gradient-text relative z-10">Welcome to Chatta</h2>
                      <p className="text-gray-400 max-w-md relative z-10">
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
                            <AvatarImage src="/lovable-uploads/efb222f9-a554-47a3-8b66-d5cfd2bf27b6.png" alt="Chatta" />
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
                            <p className="whitespace-pre-wrap">
                              {typeof message.content === 'string'
                                ? message.content.split('\n').map((line, i) =>
                                    line.startsWith('[SOLSCAN_LINK]') && line.endsWith('[/SOLSCAN_LINK]')
                                      ? (
                                          <a
                                            key={i}
                                            href={`https://solscan.io/tx/${line.replace('[SOLSCAN_LINK]', '').replace('[/SOLSCAN_LINK]', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block mt-2 px-4 py-1 bg-chatta-cyan text-black font-semibold rounded-full hover:bg-chatta-purple transition-colors"
                                          >
                                            View on Solscan
                                          </a>
                                        )
                                      : <span key={i}>{line}<br /></span>
                                  )
                                : message.content}
                            </p>
                            
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
                      <AvatarImage src="/lovable-uploads/efb222f9-a554-47a3-8b66-d5cfd2bf27b6.png" alt="Chatta" />
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
              
              {/* Quick commands - only show when messages exist */}
              {messages.length > 0 && (
                <div className="px-4 pt-2">
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
              )}
              
              {/* Input area */}
              <div className="p-4">
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
                  currentStep={currentStep}
                  inputRef={chatInputRef}
                />
              </div>
            </div>
          ) : (
            /* Wallet Connect UI */
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center w-full px-6 py-8 relative"
              >
                {/* Accent glow behind connect wallet UI */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-chatta-purple/10 rounded-full blur-3xl" />
                
                <img 
                  src="/lovable-uploads/ac4cd6a8-b121-475a-9021-d930c27581e3.png" 
                  alt="Chatta" 
                  className="h-24 mx-auto mb-6 animate-pulse-glow relative z-10" 
                />
                
                <h2 className="text-2xl font-bold gradient-text mb-4 relative z-10">Connect Your Wallet</h2>
                <p className="text-gray-400 mb-8 relative z-10">
                  To access Chatta's AI assistant for Solana, please connect your wallet to continue.
                </p>
                
                <Button 
                  onClick={handleConnectWallet}
                  variant="chatta-gradient"
                  size="chatta"
                  className="py-3 font-medium relative z-10"
                >
                  <Wallet className="mr-2" size={18} />
                  Connect Wallet
                </Button>
              </motion.div>
            </div>
          )}
          {/* Show sign transaction button if unsignedTx is present */}
          {unsignedTx && (
            <div className="p-6 rounded-2xl border-2 border-chatta-purple bg-chatta-purple/10 shadow-lg flex flex-col items-center max-w-xl mx-auto my-6 relative">
              <button
                onClick={() => { setUnsignedTx(null); setPendingMint(null); }}
                className="absolute top-2 right-2 text-chatta-cyan hover:text-chatta-purple text-xl font-bold focus:outline-none"
                title="Close"
              >
                ×
              </button>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-chatta-cyan" size={28} />
                <span className="text-lg font-bold text-chatta-cyan">Signature Required</span>
              </div>
              <div className="text-base text-white mb-4 text-center">
                A transaction needs your signature to complete token creation.<br />
                Please sign with your connected wallet to continue.
              </div>
              <Button
                onClick={handleSignAndSend}
                className="bg-chatta-cyan hover:bg-chatta-purple text-black font-bold px-6 py-2 rounded-full shadow"
              >
                <CheckCircle className="mr-2" size={18} /> Sign Transaction
              </Button>
              {pendingMint && (
                <div className="mt-3 text-xs text-chatta-cyan">
                  Mint: {pendingMint}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
