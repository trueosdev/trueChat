"use client";

import Link from "next/link";
import { MoreHorizontal, SquarePen } from "lucide-react";
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
  }[];
  onClick?: () => void;
  isMobile: boolean;
  onChatSelect?: (conversationId: string) => void;
  onNewChat?: () => void;
  loading?: boolean;
}

export function Sidebar({ chats, isCollapsed, isMobile, onChatSelect, onNewChat, loading = false }: SidebarProps) {
  return (
    <div
      data-collapsed={isCollapsed}
      className="relative group flex flex-col h-full bg-muted/10 dark:bg-muted/20 gap-4 p-2 data-[collapsed=true]:p-2 "
    >
      {!isCollapsed && (
        <div className="flex justify-between px-2 items-center text-left">
          <div className="flex items-center gap-0">
            <UserAvatarMenu />

            <button
              onClick={onNewChat}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9",
              )}
            >
              <SquarePen size={20} />
            </button>
          </div>
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
                      "h-9 w-9",
                      chat.variant === "secondary" &&
                        "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white",
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={chat.avatar}
                        alt={chat.avatar}
                      />
                    </Avatar>
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
                "justify-start gap-3 px-2 py-3",
              )}
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage
                  src={chat.avatar}
                  alt={chat.avatar}
                />
              </Avatar>
              <div className="flex flex-col max-w-28 text-left">
                <span>{chat.name}</span>
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
