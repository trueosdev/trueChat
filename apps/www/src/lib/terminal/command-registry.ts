import { CommandHandler, CommandRegistry } from "./commands/index";
import { helpCommand } from "./commands/help";
import { chatCommand } from "./commands/chat";
import { sendCommand } from "./commands/send";
import { listCommand } from "./commands/list";
import { clearCommand } from "./commands/clear";
import { whoamiCommand } from "./commands/whoami";
import { statusCommand } from "./commands/status";
import { exitCommand } from "./commands/exit";
import { themeCommand } from "./commands/theme";

const commands: CommandHandler[] = [
  helpCommand,
  chatCommand,
  sendCommand,
  listCommand,
  clearCommand,
  whoamiCommand,
  statusCommand,
  exitCommand,
  themeCommand,
];

export function createCommandRegistry(): CommandRegistry {
  const registry = new Map<string, CommandHandler>();

  for (const command of commands) {
    // Register main command name
    registry.set(command.name, command);
    
    // Register aliases
    if (command.aliases) {
      for (const alias of command.aliases) {
        registry.set(alias, command);
      }
    }
  }

  return registry;
}

export function getCommand(name: string, registry: CommandRegistry): CommandHandler | undefined {
  return registry.get(name.toLowerCase());
}

export function getAllCommands(registry: CommandRegistry): CommandHandler[] {
  const seen = new Set<string>();
  const result: CommandHandler[] = [];
  
  for (const command of registry.values()) {
    if (!seen.has(command.name)) {
      seen.add(command.name);
      result.push(command);
    }
  }
  
  return result;
}

