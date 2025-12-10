"use client";

import { Message, ConversationWithUser } from "@/app/data";
import { cn } from "@/lib/utils";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
  ChatMessageList,
} from "@shadcn-chat/ui";
import { Forward, Heart, Check, CheckCheck, Download, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { TypingState } from "@/lib/services/presence";
import { isImageFile, formatFileSize } from "@/lib/services/attachments";
import { toggleMessageLike, editMessage } from "@/lib/services/messages";
import useChatStore from "@/hooks/useChatStore";
import { useState } from "react";

interface ChatListProps {
  messages: Message[];
  conversation: ConversationWithUser;
  isMobile: boolean;
  typingUsers?: TypingState[];
}

// Component to wrap ChatBubbleAvatar with theme-aware avatar URL
function ThemeChatBubbleAvatar({ avatarUrl }: { avatarUrl?: string | null }) {
  const themeAwareUrl = useAvatarUrl(avatarUrl);
  return <ChatBubbleAvatar src={themeAwareUrl} />;
}

export function ChatList({
  messages,
  conversation,
  isMobile,
  typingUsers = [],
}: ChatListProps) {
  const { user } = useAuth();
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Find replied-to message for display
  const findRepliedMessage = (replyToId: string | null | undefined): Message | null => {
    if (!replyToId) return null;
    return messages.find(m => m.id === replyToId) || null;
  };

  const getMessageVariant = (senderId: string) => {
    return senderId === user?.id ? "sent" : "received";
  };

  const renderReadReceipt = (message: Message) => {
    if (message.sender_id !== user?.id) return null;
    
    if (message.read_at) {
      return <CheckCheck className="inline h-3 w-3 ml-1 text-foreground opacity-100" />;
    }
    return <Check className="inline h-3 w-3 ml-1 text-foreground opacity-40" />;
  };

  const handleLike = async (message: Message) => {
    if (!user || !message.id) return;
    const success = await toggleMessageLike(message.id as string, user.id);
    if (success) {
      // Update will come via real-time subscription
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleEdit = (message: Message) => {
    if (message.sender_id !== user?.id) return;
    setEditingMessageId(message.id as string);
    setEditContent(message.message || "");
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!user) return;
    const success = await editMessage(messageId, editContent, user.id);
    if (success) {
      updateMessage(messageId, { message: editContent });
      setEditingMessageId(null);
      setEditContent("");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const isLiked = (message: Message): boolean => {
    if (!user || !message.likes) return false;
    return message.likes.includes(user.id);
  };

  return (
    <div className="w-full overflow-y-hidden h-full flex flex-col">
      <ChatMessageList>
        <AnimatePresence>
          {messages.map((message, index) => {
            const variant = getMessageVariant(message.sender_id || "");
            return (
              <motion.div
                key={message.id}
                data-message-id={message.id}
                layout
                initial={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
                transition={{
                  opacity: { duration: 0 },
                  layout: {
                    type: "spring",
                    bounce: 0.3,
                    duration: 0,
                  },
                }}
                style={{ originX: 0.5, originY: 0.5 }}
                className="flex flex-col gap-2 p-4"
              >
                <ChatBubble variant={variant}>
                  <ThemeChatBubbleAvatar avatarUrl={message.avatar} />
                  <ChatBubbleMessage isLoading={message.isLoading}>
                    {/* Reply context */}
                    {message.reply_to && (() => {
                      const repliedMessage = findRepliedMessage(message.reply_to);
                      if (repliedMessage) {
                        return (
                          <div className="mb-2 p-2 border-l-2 border-muted-foreground/30 bg-muted/30 rounded text-sm">
                            <div className="text-xs text-muted-foreground mb-1">
                              {repliedMessage.name}
                            </div>
                            <div className="truncate">{repliedMessage.message || '(attachment)'}</div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {/* Attachment preview */}
                    {message.attachment_url && (
                      <div className="mb-2 not-prose">
                        {isImageFile(message.attachment_type || '') ? (
                          <a 
                            href={message.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block group relative overflow-hidden rounded-xl max-w-sm"
                          >
                            <div className="relative bg-gradient-to-br from-black/3 to-black/5 dark:from-white/5 dark:to-white/10 p-1">
                              <img
                                src={message.attachment_url}
                                alt={message.attachment_name || 'Image attachment'}
                                className="rounded-lg w-full h-auto object-contain shadow-sm group-hover:scale-105 transition-transform duration-200"
                                style={{ maxHeight: '400px' }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg" />
                            </div>
                            {message.attachment_name && (
                              <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="truncate block">{message.attachment_name}</span>
                              </div>
                            )}
                          </a>
                        ) : (
                          <a
                            href={message.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 bg-gradient-to-r from-black/80 to-black/90 dark:from-white/5 dark:to-white/10 border border-black/60 dark:border-white/20 rounded-xl hover:shadow-md transition-all duration-200 group max-w-sm"
                          >
                            <div className="flex items-center justify-center w-10 h-10 bg-black/70 dark:bg-white/10 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                              <Download className="h-5 w-5 text-white/90 dark:text-white/70" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-medium text-white truncate">
                                {message.attachment_name}
                              </span>
                              <span className="text-xs text-white/70">
                                {formatFileSize(message.attachment_size || 0)}
                              </span>
                            </div>
                            <div className="text-white/50 group-hover:text-white/70 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </a>
                        )}
                      </div>
                    )}
                    {editingMessageId === message.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit(message.id as string);
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          className="w-full p-2 border rounded bg-background text-foreground resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleCancelEdit}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(message.id as string)}
                            className="text-xs text-primary hover:underline"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {message.message}
                        {message.timestamp && (
                          <span className="flex items-center gap-1">
                            <ChatBubbleTimestamp timestamp={message.timestamp} />
                            {message.edited_at && (
                              <span className="text-xs text-muted-foreground italic">(edited)</span>
                            )}
                            {renderReadReceipt(message)}
                          </span>
                        )}
                      </>
                    )}
                  </ChatBubbleMessage>
                  <ChatBubbleActionWrapper>
                    {/* Heart icon for like */}
                    <ChatBubbleAction
                      className="size-7"
                      icon={
                        <Heart 
                          className={cn(
                            "size-4",
                            isLiked(message) && "fill-red-500 text-red-500"
                          )} 
                        />
                      }
                      onClick={() => handleLike(message)}
                    />
                    {/* Forward icon for reply */}
                    <ChatBubbleAction
                      className="size-7"
                      icon={<Forward className="size-4" />}
                      onClick={() => handleReply(message)}
                    />
                    {/* Edit icon - only show for own messages */}
                    {message.sender_id === user?.id && (
                      <ChatBubbleAction
                        className="size-7"
                        icon={<Pencil className="size-4" />}
                        onClick={() => handleEdit(message)}
                      />
                    )}
                  </ChatBubbleActionWrapper>
                </ChatBubble>
              </motion.div>
            );
          })}
          
          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-col gap-2 p-4"
            >

            </motion.div>
          )}
        </AnimatePresence>
      </ChatMessageList>
    </div>
  );
}
