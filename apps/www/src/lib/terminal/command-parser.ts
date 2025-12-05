export interface ParsedCommand {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  
  // Remove leading slash if present (for backwards compatibility)
  const withoutSlash = trimmed.startsWith("/") ? trimmed.slice(1).trim() : trimmed;
  
  // Split by spaces, handling quoted strings
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < withoutSlash.length; i++) {
    const char = withoutSlash[i];
    
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = "";
    } else if (char === " " && !inQuotes) {
      if (current) {
        parts.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    parts.push(current);
  }

  if (parts.length === 0) {
    throw new Error("No command specified");
  }

  const command = parts[0].toLowerCase();
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  // Parse arguments and flags
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    
    if (part.startsWith("--")) {
      // Flag
      const flagName = part.slice(2);
      if (i + 1 < parts.length && !parts[i + 1].startsWith("--")) {
        flags[flagName] = parts[i + 1];
        i++; // Skip the next part as it's the flag value
      } else {
        flags[flagName] = true;
      }
    } else {
      args.push(part);
    }
  }

  return { command, args, flags };
}

