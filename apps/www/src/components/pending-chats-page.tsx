"use client";

import React, { useEffect, useState } from "react";
import { Check, X, Mailbox, Coffee } from "lucide-react";
import { Avatar } from "./ui/avatar";
import { ThemeAvatarImage } from "./ui/theme-avatar";
import { Button } from "./ui/button";
import { getPendingRequests, getOutgoingRequests, acceptChatRequest, denyChatRequest, getCooldownRemaining, type ChatRequest } from "@/lib/services/chat-requests";
import { useAuth } from "@/hooks/useAuth";
import { ExpandableChatHeader } from "@shadcn-chat/ui";
import useChatStore from "@/hooks/useChatStore";
import { getConversations } from "@/lib/services/conversations";

interface PendingChatsPageProps {
  onRequestAccepted?: (conversationId: string) => void;
}

type ViewType = 'incoming' | 'outgoing';

export function PendingChatsPage({ onRequestAccepted }: PendingChatsPageProps) {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<ChatRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, number | null>>({});
  const [activeView, setActiveView] = useState<ViewType>('incoming');
  const setConversations = useChatStore((state) => state.setConversations);
  const setSelectedConversationId = useChatStore((state) => state.setSelectedConversationId);
  const setPendingRequestCount = useChatStore((state) => state.setPendingRequestCount);

  useEffect(() => {
    if (!user) return;

    loadRequests();

    // Update cooldowns every minute
    const cooldownInterval = setInterval(() => {
      updateCooldowns();
    }, 60000);

    return () => {
      clearInterval(cooldownInterval);
    };
  }, [user]);

  const loadRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [incoming, outgoing] = await Promise.all([
        getPendingRequests(user.id),
        getOutgoingRequests(user.id),
      ]);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      setPendingRequestCount(incoming.length);
      
      // Update cooldowns for denied requests
      updateCooldowns();
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCooldowns = async () => {
    if (!user) return;

    const cooldownMap: Record<string, number | null> = {};
    for (const request of outgoingRequests) {
      if (request.status === 'denied') {
        const remaining = await getCooldownRemaining(request.requester_id, request.recipient_id);
        cooldownMap[request.id] = remaining;
      }
    }
    setCooldowns(cooldownMap);
  };

  const handleAccept = async (requestId: string) => {
    if (!user || processing) return;

    setProcessing(requestId);
    try {
      const result = await acceptChatRequest(requestId, user.id);
      if (result.success) {
        // Reload requests
        await loadRequests();
        
        // Reload conversations to include the new one
        if (user) {
          const updatedConversations = await getConversations(user.id);
          setConversations(updatedConversations);
          
          // Select the new conversation
          if (result.conversationId) {
            setSelectedConversationId(result.conversationId);
            if (onRequestAccepted) {
              onRequestAccepted(result.conversationId);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async (requestId: string) => {
    if (!user || processing) return;

    setProcessing(requestId);
    try {
      const success = await denyChatRequest(requestId, user.id);
      if (success) {
        await loadRequests();
      }
    } catch (error) {
      console.error('Error denying request:', error);
    } finally {
      setProcessing(null);
    }
  };

  const formatCooldown = (hours: number | null): string => {
    if (hours === null) return '';
    if (hours <= 0) return 'Available now';
    if (hours < 1) return `${Math.ceil(hours * 60)} minutes`;
    if (hours === 1) return '1 hour';
    return `${Math.ceil(hours)} hours`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="loader mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">

      {/* View Toggle */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-2">
          <Button
            variant={activeView === 'incoming' ? 'secondary' : 'ghost'}
            size="lg"
            onClick={() => setActiveView('incoming')}
            className="flex-1"
          >
            Incoming ({incomingRequests.length})
          </Button>
          <Button
            variant={activeView === 'outgoing' ? 'secondary' : 'ghost'}
            size="lg"
            onClick={() => setActiveView('outgoing')}
            className="flex-1"
          >
            Outgoing ({outgoingRequests.length})
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeView === 'incoming' ? (
          /* Incoming Requests */
          <div>
            {incomingRequests.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[400px] text-center text-muted-foreground">
                <div>
                  <Coffee size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No pending requests</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {incomingRequests.map((request) => {
                  const displayName = request.requester?.fullname || request.requester?.username || request.requester?.email || "Unknown";
                  return (
                    <div
                      key={request.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black"
                    >
                      <Avatar className="h-10 w-10">
                        <ThemeAvatarImage
                          avatarUrl={request.requester?.avatar_url}
                          alt={displayName}
                        />
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-black dark:text-white truncate">
                          {displayName}
                        </p>
                        {request.requester?.username && (
                          <p className="text-xs text-muted-foreground">
                            @{request.requester.username}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleAccept(request.id)}
                          disabled={processing === request.id}
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                          title="Accept"
                        >
                          <Check size={18} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeny(request.id)}
                          disabled={processing === request.id}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          title="Deny"
                        >
                          <X size={18} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Outgoing Requests */
          <div>
            {outgoingRequests.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[400px] text-center text-muted-foreground">
                <div>
                  <Mailbox size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No outgoing requests</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {outgoingRequests.map((request) => {
                  const displayName = request.recipient?.fullname || request.recipient?.username || request.recipient?.email || "Unknown";
                  const cooldown = cooldowns[request.id];
                  const showCooldown = request.status === 'denied' && cooldown !== null && cooldown > 0;
                  
                  return (
                    <div
                      key={request.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black"
                    >
                      <Avatar className="h-10 w-10">
                        <ThemeAvatarImage
                          avatarUrl={request.recipient?.avatar_url}
                          alt={displayName}
                        />
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-black dark:text-white truncate">
                          {displayName}
                        </p>
                        {request.recipient?.username && (
                          <p className="text-xs text-muted-foreground">
                            @{request.recipient.username}
                          </p>
                        )}
                        {showCooldown && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            Cooldown: {formatCooldown(cooldown)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            request.status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : request.status === 'accepted'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

