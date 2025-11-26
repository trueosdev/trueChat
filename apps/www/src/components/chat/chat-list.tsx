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
      return <CheckCheck className="inline h-3 w-3 ml-1 text-blue-500" />;
    }
    return <Check className="inline h-3 w-3 ml-1 text-gray-400" />;
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
                      <div className="mb-2">
                        {isImageFile(message.attachment_type || '') ? (
                          <a 
                            href={message.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={message.attachment_url}
                              alt={message.attachment_name || 'Attachment'}
                              className="max-w-xs rounded-lg hover:opacity-90 transition-opacity"
                            />
                          </a>
                        ) : (
                          <a
                            href={message.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {message.attachment_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(message.attachment_size || 0)}
                              </span>
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
                </div>
                <span>
                  {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ChatMessageList>
    </div>
  );
}
