import { CommandHandler } from "./index";
import { formatTable } from "../output-formatter";

export const statusCommand: CommandHandler = {
  name: "status",
  aliases: ["stat"],
  description: "Show connection status and system information",
  usage: "status",
  handler: async (args, flags, context) => {
    const conversations = context.store.conversations;
    const unreadCounts = context.store.unreadCounts;
    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

    return [
      "System Status:",
      "",
      ...formatTable(
        ["Property", "Value"],
        [
          ["Status", "Connected"],
          ["Active Conversations", String(conversations.length)],
          ["Unread Messages", String(totalUnread)],
          ["Current Chat", context.currentConversationId || "None"],
        ]
      ),
    ];
  },
};

