import React, { useEffect, useState } from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { ConversationWithUser } from "@/app/data";
import { Info, Phone, Video, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../ui/button";
import { ExpandableChatHeader } from "@shadcn-chat/ui";
import { subscribeToPresence, type UserPresence } from "@/lib/services/presence";
import { useAuth } from "@/hooks/useAuth";

interface ChatTopbarProps {
  conversation: ConversationWithUser;
  onShowMembers?: () => void;
}

export const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }];

export default function ChatTopbar({ conversation, onShowMembers }: ChatTopbarProps) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!user || conversation.is_group) return;

    const otherUser = conversation.other_user;
    if (!otherUser) return;

    // Subscribe to presence (tracks our presence and listens to others)
    const channel = subscribeToPresence(user.id, (presences) => {
      // Check if the other user is online
      const userPresence = presences[otherUser.id];
      setIsOnline(!!userPresence && userPresence.length > 0);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user, conversation]);

  if (conversation.is_group) {
    return (
      <ExpandableChatHeader>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-9 w-9 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center">
            <Users size={18} className="text-black dark:text-white" />
          </div>
          <div className="flex flex-col text-left flex-1">
            <span className="font-medium">{conversation.name || "Unnamed Group"}</span>
            <span className="text-xs text-muted-foreground">
              {conversation.participant_count || 0} members
            </span>
          </div>
          {onShowMembers && (
            <button
              onClick={onShowMembers}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-8 w-8"
              )}
            >
              <Info size={18} />
            </button>
          )}
        </div>
      </ExpandableChatHeader>
    );
  }

  const otherUser = conversation.other_user;
  if (!otherUser) return null;

  const displayName = otherUser.fullname || otherUser.username || otherUser.email || "Unknown";

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
