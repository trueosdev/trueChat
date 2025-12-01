import { useAuth } from "@/hooks/useAuth";
import useChatStore from "@/hooks/useChatStore";
import type { Message, ConversationWithUser } from "@/app/data";

// Define the store type explicitly based on what useChatStore returns
type ChatStore = {
  input: string;
  messages: Message[];
  conversations: ConversationWithUser[];
  selectedConversationId: string | null;
  loading: boolean;
  unreadCounts: Record<string, number>;
  setInput: (input: string) => void;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setConversations: (conversations: ConversationWithUser[]) => void;
  addConversation: (conversation: ConversationWithUser) => void;
  updateConversation: (conversationId: string, updates: Partial<ConversationWithUser>) => void;
  setSelectedConversationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setUnreadCounts: (counts: Record<string, number>) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
};

export interface CommandContext {
  user: ReturnType<typeof useAuth>["user"];
  store: ChatStore;
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

