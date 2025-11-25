import { ConversationWithUser } from "@/app/data";
import ChatTopbar from "./chat-topbar";
import { ChatList } from "./chat-list";
import React, { useEffect } from "react";
import useChatStore from "@/hooks/useChatStore";
import ChatBottombar from "./chat-bottombar";
import { getMessages, subscribeToMessages } from "@/lib/services/messages";
import { useAuth } from "@/hooks/useAuth";

interface ChatProps {
  conversation: ConversationWithUser;
  isMobile: boolean;
}

export function Chat({ conversation, isMobile }: ChatProps) {
  const { user } = useAuth();
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const setLoading = useChatStore((state) => state.setLoading);

  useEffect(() => {
    if (!conversation) return;

    // Load messages
    setLoading(true);
    getMessages(conversation.id).then((data) => {
      setMessages(data);
      setLoading(false);
    });

    // Subscribe to real-time message updates
    const unsubscribe = subscribeToMessages(conversation.id, (message) => {
      addMessage(message);
    });

    return () => {
      unsubscribe();
    };
  }, [conversation.id, setMessages, addMessage, setLoading]);

  return (
    <div className="flex flex-col justify-between w-full h-full">
      <ChatTopbar conversation={conversation} />

      <ChatList
        messages={messages}
        conversation={conversation}
        isMobile={isMobile}
      />

      <ChatBottombar conversationId={conversation.id} isMobile={isMobile} />
    </div>
  );
}
