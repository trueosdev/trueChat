import { CommandHandler } from "./index";

export const exitCommand: CommandHandler = {
  name: "exit",
  aliases: ["gui", "quit"],
  description: "Exit terminal mode and return to GUI",
  usage: "/exit",
  handler: async (args, flags, context) => {
    // The exit action is handled by the terminal component
    return ["Exiting terminal mode..."];
  },
};

