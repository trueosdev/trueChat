import { CommandHandler } from "./index";
import { sendMessage } from "@/lib/services/messages";
import { formatMessage } from "../output-formatter";
import { getMessages } from "@/lib/services/messages";

export const sendCommand: CommandHandler = {
  name: "send",
  aliases: ["s", "msg"],
  description: "Send a message to the current conversation",
  usage: '/send "message" | /send [user] "message"',
  handler: async (args, flags, context) => {
    if (!context.user) {
      return ["Not authenticated. Please log in."];
    }

    if (args.length === 0) {
      return [
        "Usage: /send \"message\"",
        "  or:   /send [user] \"message\"",
        "",
        "Send a message to the current conversation or to a specific user.",
      ];
    }

    let targetConversationId = context.currentConversationId;
    let messageContent = "";

    // Check if first arg is a user identifier
    if (args.length >= 2 && !args[0].startsWith('"') && !args[0].startsWith("'")) {
      // First arg might be a user, try to find conversation
      const conversations = context.store.conversations;
      const userArg = args[0];
      
      // Try to find user and their conversation
      const conversation = conversations.find(c => 
        !c.is_group && (
          c.other_user?.username?.toLowerCase() === userArg.toLowerCase() ||
          c.other_user?.email?.toLowerCase() === userArg.toLowerCase()
        )
      );

      if (conversation) {
        targetConversationId = conversation.id;
        // Join remaining args as message
        messageContent = args.slice(1).join(" ").replace(/^["']|["']$/g, "");
      } else {
        return [`User '${userArg}' not found in your conversations. Use '/chat ${userArg}' first.`];
      }
    } else {
      // All args are the message
      messageContent = args.join(" ").replace(/^["']|["']$/g, "");
    }

    if (!targetConversationId) {
      return [
        "No active conversation. Use '/chat [user]' to start a conversation first.",
      ];
    }

    if (!messageContent.trim()) {
      return ["Message cannot be empty."];
    }

    try {
      const sentMessage = await sendMessage(
        targetConversationId,
        messageContent,
        context.user.id
      );

      if (sentMessage) {
        context.store.addMessage(sentMessage);
        
        // Refresh messages to show in terminal
        const messages = await getMessages(targetConversationId);
        const recentMessages = messages.slice(-10); // Show last 10 messages
        
        const lines: string[] = [
          "Message sent!",
          "",
          "Recent messages:",
          "",
        ];

        for (const msg of recentMessages) {
          const isOwn = msg.sender_id === context.user.id;
          const senderName = msg.sender?.fullname || msg.sender?.username || msg.name || "Unknown";
          lines.push(formatMessage({
            sender: senderName,
            content: msg.content,
            timestamp: msg.created_at,
            isOwn,
          }));
        }

        return lines;
      } else {
        return ["Failed to send message."];
      }
    } catch (error) {
      return [`Error sending message: ${error}`];
    }
  },
};

