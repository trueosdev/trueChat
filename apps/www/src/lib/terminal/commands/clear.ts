import { CommandHandler } from "./index";

export const clearCommand: CommandHandler = {
  name: "clear",
  aliases: ["cls"],
  description: "Clear the terminal output",
  usage: "clear",
  handler: async (args, flags, context) => {
    // The clear action is handled by the terminal component
    // This just returns a message
    return ["Terminal cleared."];
  },
};

