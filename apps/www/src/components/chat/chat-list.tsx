import { Message, ConversationWithUser } from "@/app/data";
import { cn } from "@/lib/utils";
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
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import { Forward, Heart, Check, CheckCheck, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { TypingState } from "@/lib/services/presence";
import { isImageFile, formatFileSize } from "@/lib/services/attachments";

interface ChatListProps {
  messages: Message[];
  conversation: ConversationWithUser;
  isMobile: boolean;
  typingUsers?: TypingState[];
}

export function ChatList({
  messages,
  conversation,
  isMobile,
  typingUsers = [],
}: ChatListProps) {
  const { user } = useAuth();
  const actionIcons = [
    { icon: DotsVerticalIcon, type: "More" },
    { icon: Forward, type: "Like" },
    { icon: Heart, type: "Share" },
  ];

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

  return (
    <div className="w-full overflow-y-hidden h-full flex flex-col">
      <ChatMessageList>
        <AnimatePresence>
          {messages.map((message, index) => {
            const variant = getMessageVariant(message.sender_id || "");
            return (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
                transition={{
                  opacity: { duration: 0.1 },
                  layout: {
                    type: "spring",
                    bounce: 0.3,
                    duration: index * 0.05 + 0.2,
                  },
                }}
                style={{ originX: 0.5, originY: 0.5 }}
                className="flex flex-col gap-2 p-4"
              >
                <ChatBubble variant={variant}>
                  <ChatBubbleAvatar src={message.avatar} />
                  <ChatBubbleMessage isLoading={message.isLoading}>
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
                    {message.message}
                    {message.timestamp && (
                      <span className="flex items-center gap-1">
                        <ChatBubbleTimestamp timestamp={message.timestamp} />
                        {renderReadReceipt(message)}
                      </span>
                    )}
                  </ChatBubbleMessage>
                  <ChatBubbleActionWrapper>
                    {actionIcons.map(({ icon: Icon, type }) => (
                      <ChatBubbleAction
                        className="size-7"
                        key={type}
                        icon={<Icon className="size-4" />}
                        onClick={() =>
                          console.log(
                            "Action " + type + " clicked for message " + message.id,
                          )
                        }
                      />
                    ))}
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
