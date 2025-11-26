import React, { useEffect, useState } from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { ConversationWithUser } from "@/app/data";
import { Info, Phone, Video } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";
import { ExpandableChatHeader } from "@shadcn-chat/ui";
import { subscribeToPresence, type UserPresence } from "@/lib/services/presence";

interface ChatTopbarProps {
  conversation: ConversationWithUser;
}

export const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }];

export default function ChatTopbar({ conversation }: ChatTopbarProps) {
  const otherUser = conversation.other_user;
  const displayName = otherUser.fullname || otherUser.username || otherUser.email || "Unknown";
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Listen to all users' presence
    const channel = subscribeToPresence((presences) => {
      // Check if the other user is online
      const userPresence = presences[otherUser.id];
      setIsOnline(!!userPresence && userPresence.length > 0);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [otherUser.id]);

  return (
    <ExpandableChatHeader>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={otherUser.avatar_url || ""}
              alt={displayName}
            />
          </Avatar>
          {/* Online status indicator */}
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>
        <div className="flex flex-col text-left">
          <span className="font-medium">{displayName}</span>
          <span className="text-xs text-muted-foreground">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

    </ExpandableChatHeader>
  );
}
