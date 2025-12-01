import { useAuth } from "@/hooks/useAuth";
import useChatStore from "@/hooks/useChatStore";

export interface CommandContext {
  user: ReturnType<typeof useAuth>["user"];
  store: ReturnType<typeof useChatStore>;
  addOutput: (lines: string | string[]) => void;
  setCurrentConversationId: (id: string | null) => void;
  currentConversationId: string | null;
  setColorTheme?: (theme: { name: string; light: any; dark: any }) => void;
  colorThemes?: Array<{ name: string; light: any; dark: any }>;
}

export interface CommandHandler {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  handler: (args: string[], flags: Record<string, string | boolean>, context: CommandContext) => Promise<string[] | string> | string[] | string;
}

export type CommandRegistry = Map<string, CommandHandler>;

