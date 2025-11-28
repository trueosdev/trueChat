"use client";

import Link from "next/link";
import { MoreHorizontal, SquarePen, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Message } from "@/app/data";
import { UserAvatarMenu } from "./user-avatar-menu";
import { Skeleton } from "./ui/skeleton";

interface SidebarProps {
  isCollapsed: boolean;
  chats: {
    id: string;
    name: string;
    messages: Message[];
    avatar: string;
    variant: "secondary" | "ghost";
    hasUnread?: boolean;
    isGroup?: boolean;
    participantCount?: number;
  }[];
  onClick?: () => void;
  isMobile: boolean;
  onChatSelect?: (conversationId: string) => void;
  onNewChat?: () => void;
  onNewGroup?: () => void;
  loading?: boolean;
}

export function Sidebar({ chats, isCollapsed, isMobile, onChatSelect, onNewChat, onNewGroup, loading = false }: SidebarProps) {
  return (
    <div
      data-collapsed={isCollapsed}
      className="relative group flex flex-col h-full bg-muted/10 dark:bg-muted/20 gap-4 p-2 data-[collapsed=true]:p-2 "
    >
      {!isCollapsed && (
        <div className="flex items-center gap-2 px-2 text-left">
          <div className="flex items-center gap-2">
            <UserAvatarMenu />

            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={onNewChat}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "h-9 w-9",
                    )}
                  >
                    <SquarePen size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  New Chat
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={onNewGroup}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "h-9 w-9",
                    )}
                  >
                    <Users size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  New Group
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="flex flex-col gap-1 px-2">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={onNewChat}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-9 w-9",
                  )}
                >
                  <SquarePen size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                New Chat
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={onNewGroup}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-9 w-9",
                  )}
                >
                  <Users size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                New Group
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <nav className="grid gap-1 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, index) => (
            isCollapsed ? (
              <Skeleton key={index} className="h-9 w-9 rounded-full" />
            ) : (
              <div key={index} className="flex items-center gap-3 px-2 py-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            )
          ))
        ) : (
          chats.map((chat, index) =>
          isCollapsed ? (
            <TooltipProvider key={chat.id}>
              <Tooltip key={chat.id} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onChatSelect?.(chat.id)}
                    className={cn(
                      buttonVariants({ variant: chat.variant, size: "icon" }),
                      "h-9 w-9 relative",
                      chat.variant === "secondary" &&
                        "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white",
                    )}
                  >
                    {chat.isGroup ? (
                      <div className="h-9 w-9 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center">
                        <Users size={18} className="text-black dark:text-white" />
                      </div>
                    ) : (
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={chat.avatar}
                          alt={chat.avatar}
                        />
                      </Avatar>
                    )}
                    {/* Unread notification indicator */}
                    {chat.hasUnread && (
                      <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-white border-2 border-background rounded-full" />
                    )}
                    <span className="sr-only">{chat.name}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="flex items-center gap-4"
                >
                  {chat.name}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <button
              key={chat.id}
              onClick={() => onChatSelect?.(chat.id)}
              className={cn(
                buttonVariants({ variant: chat.variant, size: "xl" }),
                chat.variant === "secondary" &&
                  "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white shrink",
                chat.variant === "ghost" && "border border-transparent",
                "justify-start gap-3 px-2 py-3",
              )}
            >
              <div className="relative shrink-0">
                {chat.isGroup ? (
                  <div className="h-9 w-9 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center">
                    <Users size={18} className="text-black dark:text-white" />
                  </div>
                ) : (
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={chat.avatar}
                      alt={chat.avatar}
                    />
                  </Avatar>
                )}
                {/* Unread notification indicator */}
                {chat.hasUnread && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-white border-2 border-background rounded-full" />
                )}
              </div>
              <div className="flex flex-col max-w-28 text-left">
                <div className="flex items-center gap-1">
                  <span className="truncate">{chat.name}</span>
                  {chat.isGroup && chat.participantCount && (
                    <span className="text-xs text-black/70 dark:text-white/70 shrink-0">
                      ({chat.participantCount})
                    </span>
                  )}
                </div>
                {chat.messages.length > 0 && (
                  <span className="text-black dark:text-white text-xs truncate">
                    {chat.messages[chat.messages.length - 1].name.split(" ")[0]}
                    :{" "}
                    {chat.messages[chat.messages.length - 1].isLoading
                      ? "Typing..."
                      : chat.messages[chat.messages.length - 1].message}
                  </span>
                )}
              </div>
            </button>
          )
        ))}
      </nav>
    </div>
  );
}
