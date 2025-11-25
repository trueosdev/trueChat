import { Message, ConversationWithUser } from "@/app/data";
import { create } from "zustand";

interface State {
  input: string;
  messages: Message[];
  conversations: ConversationWithUser[];
  selectedConversationId: string | null;
  loading: boolean;
}

interface Actions {
  setInput: (input: string) => void;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setConversations: (conversations: ConversationWithUser[]) => void;
  addConversation: (conversation: ConversationWithUser) => void;
  updateConversation: (conversationId: string, updates: Partial<ConversationWithUser>) => void;
  setSelectedConversationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const useChatStore = create<State & Actions>()((set) => ({
  input: "",
  messages: [],
  conversations: [],
  selectedConversationId: null,
  loading: false,

  setInput: (input) => set({ input }),
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => set({ input: e.target.value }),

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) => set((state) => ({ 
    conversations: [conversation, ...state.conversations] 
  })),
  updateConversation: (conversationId, updates) => set((state) => ({
    conversations: state.conversations.map((conv) =>
      conv.id === conversationId ? { ...conv, ...updates } : conv
    ),
  })),
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
  setLoading: (loading) => set({ loading }),
}));

export default useChatStore;
