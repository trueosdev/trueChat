import { CommandHandler } from "./index";
import { formatTable } from "../output-formatter";
import { createCommandRegistry, getAllCommands } from "../command-registry";

export const helpCommand: CommandHandler = {
  name: "help",
  aliases: ["h", "?"],
  description: "Show help information",
  usage: "/help [command]",
  handler: async (args, flags, context) => {
    const registry = createCommandRegistry();
    
    if (args.length === 0) {
      // Show all commands
      const commands = getAllCommands(registry);
      const lines: string[] = [
        "Available Commands:",
        "",
        ...formatTable(
          ["Command", "Aliases", "Description"],
          commands.map(cmd => [
            `/${cmd.name}`,
            cmd.aliases ? cmd.aliases.join(", ") : "",
            cmd.description,
          ])
        ),
        "",
        "Type '/help <command>' for detailed information about a specific command.",
      ];
      return lines;
    } else {
      // Show help for specific command
      const commandName = args[0].toLowerCase();
      const command = registry.get(commandName);
      
      if (!command) {
        return [`Command '/${commandName}' not found. Type '/help' to see all commands.`];
      }
      
      return [
        `Command: /${command.name}`,
        `Description: ${command.description}`,
        `Usage: ${command.usage}`,
        command.aliases ? `Aliases: ${command.aliases.join(", ")}` : "",
      ].filter(Boolean);
    }
  },
};

