import { CommandHandler } from "./index";
import { formatTable } from "../output-formatter";

export const whoamiCommand: CommandHandler = {
  name: "whoami",
  description: "Display current user information",
  usage: "/whoami",
  handler: async (args, flags, context) => {
    if (!context.user) {
      return ["Not authenticated. Please log in."];
    }

    const user = context.user;
    const displayName = user.user_metadata?.fullname || 
                       user.user_metadata?.username || 
                       user.email || 
                       "Unknown";

    return [
      "Current User:",
      "",
      ...formatTable(
        ["Property", "Value"],
        [
          ["ID", user.id],
          ["Name", displayName],
          ["Email", user.email || "N/A"],
          ["Username", user.user_metadata?.username || "N/A"],
        ]
      ),
    ];
  },
};

