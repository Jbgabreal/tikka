
import React from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";

const Chat = () => {
  return (
    <div className="min-h-screen bg-chatta-dark text-white flex">
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
};

export default Chat;
