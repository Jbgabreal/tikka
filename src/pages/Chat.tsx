
import React from "react";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";

const Chat = () => {
  return (
    <div className="min-h-screen bg-chatta-dark text-white flex justify-center">
      <div className="flex w-[70%]">
        <ChatSidebar />
        <ChatWindow />
      </div>
    </div>
  );
};

export default Chat;
