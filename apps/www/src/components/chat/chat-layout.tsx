"use client";

import React, { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { Sidebar } from "../sidebar";
import { Chat } from "./chat";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { getConversations, subscribeToConversations } from "@/lib/services/conversations";
import useChatStore from "@/hooks/useChatStore";
import type { ConversationWithUser } from "@/app/data";
import { NewChatDialog } from "../new-chat-dialog";

interface ChatLayoutProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function ChatLayout({
  defaultLayout = [320, 480],
  defaultCollapsed = false,
  navCollapsedSize,
}: ChatLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const conversations = useChatStore((state) => state.conversations);
  const selectedConversationId = useChatStore((state) => state.selectedConversationId);
  const setConversations = useChatStore((state) => state.setConversations);
  const addConversation = useChatStore((state) => state.addConversation);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const setSelectedConversationId = useChatStore((state) => state.setSelectedConversationId);
  const setLoading = useChatStore((state) => state.setLoading);

  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenWidth();
    window.addEventListener("resize", checkScreenWidth);

    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Load conversations
    setLoading(true);
    getConversations(user.id).then((data) => {
      setConversations(data);
      setLoading(false);
    });

    // Subscribe to real-time updates
    const unsubscribe = subscribeToConversations(user.id, (conversation) => {
      const exists = conversations.find((c) => c.id === conversation.id);
      if (exists) {
        updateConversation(conversation.id, conversation);
      } else {
        addConversation(conversation);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, setConversations, addConversation, updateConversation, setLoading]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <div className="loader mx-auto"></div>
        </div>
      </div>
    );
  }

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  const handleConversationCreated = async (conversationId: string) => {
    // Reload conversations to get the new one with user details
    if (user) {
      const updatedConversations = await getConversations(user.id);
      setConversations(updatedConversations);
      setSelectedConversationId(conversationId);
    }
  };

  return (
    <ProtectedRoute>
      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onConversationCreated={handleConversationCreated}
      />
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            sizes,
          )}`;
        }}
        className="h-full items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={isMobile ? 0 : 24}
          maxSize={isMobile ? 8 : 30}
          onCollapse={() => {
            setIsCollapsed(true);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              true,
            )}`;
          }}
          onExpand={() => {
            setIsCollapsed(false);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              false,
            )}`;
          }}
          className={cn(
            isCollapsed &&
              "min-w-[50px] md:min-w-[70px] transition-all duration-300 ease-in-out",
          )}
        >
          <Sidebar
            isCollapsed={isCollapsed || isMobile}
            chats={conversations.map((conv) => ({
              id: conv.id,
              name: conv.other_user.fullname || conv.other_user.username || conv.other_user.email || "Unknown",
              messages: conv.last_message ? [{
                id: conv.last_message.id,
                name: conv.other_user.fullname || conv.other_user.username || "Unknown",
                message: conv.last_message.content,
                timestamp: new Date(conv.last_message.created_at).toLocaleTimeString(),
                avatar: conv.other_user.avatar_url || "",
              }] : [],
              avatar: conv.other_user.avatar_url || "",
              variant: selectedConversationId === conv.id ? "secondary" : "ghost",
            }))}
            isMobile={isMobile}
            onChatSelect={(conversationId) => {
              useChatStore.getState().setSelectedConversationId(conversationId);
            }}
            onNewChat={() => setNewChatOpen(true)}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          {selectedConversation ? (
            <Chat
              conversation={selectedConversation}
              isMobile={isMobile}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-black dark:text-white">
              Select a conversation to start chatting
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </ProtectedRoute>
  );
}
