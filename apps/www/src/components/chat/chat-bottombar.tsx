import {
  FileImage,
  Mic,
  Paperclip,
  PlusCircle,
  SendHorizontal,
  ThumbsUp,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { Button, buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { EmojiPicker } from "../emoji-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ChatInput } from "@shadcn-chat/ui";
import { sendMessage } from "@/lib/services/messages";
import { useAuth } from "@/hooks/useAuth";
import useChatStore from "@/hooks/useChatStore";
import { uploadAttachment, type AttachmentData, formatFileSize } from "@/lib/services/attachments";
import { broadcastTyping } from "@/lib/services/presence";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ChatBottombarProps {
  conversationId: string;
  isMobile: boolean;
  typingChannel: RealtimeChannel | null;
}

export const BottombarIcons = [{ icon: FileImage }, { icon: Paperclip }];

export default function ChatBottombar({ conversationId, isMobile, typingChannel }: ChatBottombarProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMessage = useChatStore((state) => state.addMessage);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
    
    // Broadcast typing indicator
    if (user && typingChannel) {
      broadcastTyping(
        typingChannel, 
        user.id, 
        conversationId, 
        true, 
        user.user_metadata?.username || user.user_metadata?.fullname
      );
      
      // Clear typing after 3 seconds of no typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (typingChannel) {
          broadcastTyping(
            typingChannel, 
            user.id, 
            conversationId, 
            false, 
            user.user_metadata?.username || user.user_metadata?.fullname
          );
        }
      }, 3000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleThumbsUp = async () => {
    if (!user || !conversationId) return;
    
    setSelectedLoading(true);
    const sentMessage = await sendMessage(conversationId, "👍", user.id);
    if (sentMessage) {
      addMessage(sentMessage);
    }
    setSelectedLoading(false);
  };

  const handleSend = async () => {
    if ((!message.trim() && !selectedFile) || !user || !conversationId) return;
    
    setSelectedLoading(true);
    
    try {
      let attachment: AttachmentData | undefined = undefined;
      
      // Upload file if selected
      if (selectedFile) {
        setUploading(true);
        const uploadResult = await uploadAttachment(user.id, selectedFile);
        setUploading(false);
        
        if (!uploadResult) {
          alert('Failed to upload file');
          setSelectedLoading(false);
          return;
        }
        attachment = uploadResult;
      }
      
      const sentMessage = await sendMessage(
        conversationId, 
        message.trim() || ' ',  // Space if only attachment
        user.id,
        attachment
      );
      
      if (sentMessage) {
        addMessage(sentMessage);
        setMessage("");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Stop typing indicator
        if (typingChannel) {
          broadcastTyping(
            typingChannel, 
            user.id, 
            conversationId, 
            false, 
            user.user_metadata?.username || user.user_metadata?.fullname
          );
        }
        
        // Clear timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSelectedLoading(false);
      setUploading(false);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }

    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      setMessage((prev) => prev + "\n");
    }
  };

  return (
    <div className="px-2 py-4 flex justify-between w-full items-center gap-2 relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={handleFileSelect}
        className="hidden"
        disabled={selectedLoading || uploading}
      />
      
      {/* File preview */}
      {selectedFile && (
        <div className="absolute bottom-full left-2 right-2 mb-2 p-3 bg-muted rounded-lg flex items-center justify-between shadow-lg border border-border">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemoveFile}
            className="h-6 w-6 shrink-0"
            disabled={selectedLoading || uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex">
        <Popover>
          <PopoverTrigger asChild>
            <Link
              href="#"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9",
                "shrink-0",
              )}
            >
              <PlusCircle size={22} className="text-muted-foreground" />
            </Link>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-full p-2">
            {message.trim() || isMobile ? (
              <div className="flex gap-2">
                <Link
                  href="#"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-9 w-9",
                    "shrink-0",
                  )}
                >
                  <Mic size={22} className="text-muted-foreground" />
                </Link>
                {BottombarIcons.map((icon, index) => (
                  <button
                    key={index}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "h-9 w-9",
                      "shrink-0",
                    )}
                    disabled={selectedLoading || uploading}
                  >
                    <icon.icon size={22} className="text-muted-foreground" />
                  </button>
                ))}
              </div>
            ) : (
              <Link
                href="#"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "h-9 w-9",
                  "shrink-0",
                )}
              >
                <Mic size={22} className="text-muted-foreground" />
              </Link>
            )}
          </PopoverContent>
        </Popover>
        {!message.trim() && !isMobile && (
          <div className="flex">
            {BottombarIcons.map((icon, index) => (
              <button
                key={index}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "h-9 w-9",
                  "shrink-0",
                )}
                disabled={selectedLoading || uploading}
              >
                <icon.icon size={22} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        <motion.div
          key="input"
          className="w-full relative"
          layout
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{
            opacity: { duration: 0.05 },
            layout: {
              type: "spring",
              bounce: 0.15,
            },
          }}
        >
          <ChatInput
            value={message}
            ref={inputRef}
            onKeyDown={handleKeyPress}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="rounded-full"
          />
          <div className="absolute right-4 bottom-2  ">
            <EmojiPicker
              onChange={(value) => {
                setMessage(message + value);
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
            />
          </div>
        </motion.div>

        {message.trim() || selectedFile ? (
          <Button
            className="h-9 w-9 shrink-0"
            onClick={handleSend}
            disabled={selectedLoading || uploading}
            variant="ghost"
            size="icon"
          >
            {uploading ? (
              <Loader2 size={22} className="text-muted-foreground animate-spin" />
            ) : (
              <SendHorizontal size={22} className="text-muted-foreground" />
            )}
          </Button>
        ) : (
          <Button
            className="h-9 w-9 shrink-0"
            onClick={handleThumbsUp}
            disabled={selectedLoading}
            variant="ghost"
            size="icon"
          >
            <ThumbsUp size={22} className="text-muted-foreground" />
          </Button>
        )}
      </AnimatePresence>
    </div>
  );
}
