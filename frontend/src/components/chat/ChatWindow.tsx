import React, { useState, useEffect, useRef } from "react";
import { Send, Paperclip } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import './ChatMarkdown.css';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  options?: string[];
}

const ChatWindow = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("Updated messages:", messages);
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    console.log("handleSubmit called with:", newMessage);

    const userMsg = {
      id: crypto.randomUUID(),
      content: newMessage,
      isUser: true,
    };
    setMessages(prev => [...prev, userMsg]);
    setNewMessage("");
    
    try {
      console.log("About to fetch...");
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newMessage,
          context: {
            // Add walletAddress or other context if needed
          }
        }),
      });
      console.log("Fetch complete, about to parse JSON...");
      const data = await response.json();
      console.log("Received data from backend:", data);
      const content = data.prompt || data.response || data.error || data.content || "No response from assistant.";
      setMessages([
        { id: crypto.randomUUID(), content: "USER: " + newMessage, isUser: true },
        { id: crypto.randomUUID(), content: "BOT: " + content, isUser: false }
      ]);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), content: "Error contacting backend.", isUser: false }
      ]);
    }
  };

  // Debug log for messages before rendering
  console.log("Rendering messages:", messages);

  return (
    <div className="flex flex-col h-screen w-full">
      <header className="border-b border-chatta-purple/10 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/4e3faff9-aeeb-4667-84fe-6c0002c1fca1.png" alt="Chatta" className="h-8" />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-chatta-purple/5 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-chatta-cyan"></div>
            <span>Wallet: 8xF2...k9J3</span>
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4 py-4">
          <div className="space-y-6">
            {messages.map(msg => {
              console.log("Rendering message:", msg);
              // Always render all messages, even if content is empty or step is undefined
              const displayContent = msg.content && msg.content.trim() ? msg.content : '[No content]';
              return (
              <div 
                key={msg.id}
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} gap-3`}
              >
                {!msg.isUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/lovable-uploads/d2b1a35c-65a9-4cc4-b0cd-d9788572aae6.png" alt="Chatta" />
                    <AvatarFallback className="bg-chatta-purple/20 text-chatta-purple">CH</AvatarFallback>
                  </Avatar>
                )}
                
                <div 
                  className={`max-w-[75%] flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`rounded-2xl px-4 py-2 ${
                      msg.isUser 
                        ? 'bg-white/10 text-white' 
                        : 'bg-chatta-purple/10 border border-chatta-purple/20'
                    }`}
                  >
                      {/* Render Markdown for assistant messages, plain text for user */}
                      {msg.isUser ? (
                        <p>{displayContent}</p>
                      ) : (
                        <div className="markdown-body">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                          >
                            {displayContent}
                          </ReactMarkdown>
                        </div>
                      )}
                  </div>
                  
                  {msg.options && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {msg.options.map((option, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          className="bg-chatta-darker border-chatta-purple/20 hover:border-chatta-purple hover:bg-chatta-purple/10 hover:glow text-sm"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                
                {msg.isUser && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-chatta-gray/20">U</AvatarFallback>
                  </Avatar>
                )}
              </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-chatta-purple/10 p-4 flex-shrink-0 bg-chatta-dark">
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            className="text-chatta-gray hover:text-white"
          >
            <Paperclip size={20} />
          </Button>
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 bg-chatta-darker border-chatta-purple/10 focus-visible:ring-chatta-purple"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="bg-chatta-purple hover:bg-chatta-purple/90 glow"
          >
            <Send size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
