import { ConversationWithUser } from "@/app/data";
import ChatTopbar from "./chat-topbar";
import { ChatList } from "./chat-list";
import React, { useEffect, useState } from "react";
import useChatStore from "@/hooks/useChatStore";
import ChatBottombar from "./chat-bottombar";
import { getMessages, subscribeToMessages, markMessagesAsRead } from "@/lib/services/messages";
import { useAuth } from "@/hooks/useAuth";
import { subscribeToTypingIndicator } from "@/lib/services/presence";
import type { TypingState } from "@/lib/services/presence";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ChatProps {
  conversation: ConversationWithUser;
  isMobile: boolean;
}

export function Chat({ conversation, isMobile }: ChatProps) {
  const { user } = useAuth();
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const setLoading = useChatStore((state) => state.setLoading);
  const [typingUsers, setTypingUsers] = useState<TypingState[]>([]);
  const [typingChannel, setTypingChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversation || !user) return;

    // Load messages
    setLoading(true);
    getMessages(conversation.id).then((data) => {
      setMessages(data);
      setLoading(false);
      // Mark messages as read when loading
      markMessagesAsRead(conversation.id, user.id);
    });

    // Subscribe to real-time message updates
    const unsubscribe = subscribeToMessages(conversation.id, (message) => {
      // Check if message exists (for updates like read receipts)
      const exists = messages.find(m => m.id === message.id);
      if (exists) {
        updateMessage(message.id as string, message);
      } else {
        addMessage(message);
      }
      // Mark new messages as read if they're from other user
      if (message.sender_id !== user.id) {
        markMessagesAsRead(conversation.id, user.id);
      }
    });

    // Subscribe to typing indicators
    const channel = subscribeToTypingIndicator(
      conversation.id,
      user.id,
      (typing) => {
        setTypingUsers(typing);
      }
    );
    setTypingChannel(channel);

    return () => {
      unsubscribe();
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [conversation.id, user, setMessages, addMessage, updateMessage, setLoading]);

  return (
    <div className="flex flex-col justify-between w-full h-full">
      <ChatTopbar conversation={conversation} />

      <ChatList
        messages={messages}
        conversation={conversation}
        isMobile={isMobile}
        typingUsers={typingUsers}
      />

      <ChatBottombar 
        conversationId={conversation.id} 
        isMobile={isMobile}
        typingChannel={typingChannel}
      />
    </div>
  );
}
