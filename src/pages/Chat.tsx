
import React, { useState, useCallback } from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { PureMultimodalInput } from "@/components/ui/multimodal-ai-chat-input";

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

const Chat = () => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatId] = useState('main-chat');

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

  return (
    <div className="min-h-screen bg-chatta-dark text-white flex justify-center">
      <div className="flex w-[70%]">
        <ChatSidebar />
        
        <div className="flex-1 flex flex-col h-screen">
          {/* Messages display area */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`mb-4 p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-chatta-purple/20 ml-auto max-w-[80%]' 
                    : 'bg-gray-800 mr-auto max-w-[80%]'
                }`}
              >
                <p>{message.content}</p>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.attachments.map((attachment) => (
                      <div 
                        key={attachment.url} 
                        className="bg-gray-700 rounded p-1 text-xs"
                      >
                        {attachment.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Input area */}
          <div className="p-4 border-t border-chatta-purple/10">
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
