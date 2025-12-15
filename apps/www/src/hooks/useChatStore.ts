import { Message, ConversationWithUser } from "@/app/data";
import { create } from "zustand";

interface State {
  input: string;
  messages: Message[];
  conversations: ConversationWithUser[];
  selectedConversationId: string | null;
  loading: boolean;
  unreadCounts: Record<string, number>;
  replyingTo: Message | null;
  pendingRequestCount: number;
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
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setConversations: (conversations: ConversationWithUser[]) => void;
  addConversation: (conversation: ConversationWithUser) => void;
  updateConversation: (conversationId: string, updates: Partial<ConversationWithUser>) => void;
  setSelectedConversationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setUnreadCounts: (counts: Record<string, number>) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
  setReplyingTo: (message: Message | null) => void;
  setPendingRequestCount: (count: number) => void;
}

const useChatStore = create<State & Actions>()((set) => ({
  input: "",
  messages: [],
  conversations: [],
  selectedConversationId: null,
  loading: false,
  unreadCounts: {},
  replyingTo: null,
  pendingRequestCount: 0,

  setInput: (input) => set({ input }),
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => set({ input: e.target.value }),

  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => {
    // Prevent duplicate messages
    const exists = state.messages.some(m => m.id === message.id);
    if (exists) return state;
    
    return { messages: [...state.messages, message] };
  }),
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    ),
  })),

  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) => set((state) => {
    // Prevent duplicate conversations
    const exists = state.conversations.some(c => c.id === conversation.id);
    if (exists) return state;
    
    return { 
      conversations: [conversation, ...state.conversations] 
    };
  }),
  updateConversation: (conversationId, updates) => set((state) => {
    // Update the conversation and move it to the top of the list
    const updatedConversations = state.conversations.map((conv) =>
      conv.id === conversationId ? { ...conv, ...updates } : conv
    );
    
    // Sort by last_message created_at or conversation created_at (most recent first)
    updatedConversations.sort((a, b) => {
      const aTime = a.last_message?.created_at || a.created_at;
      const bTime = b.last_message?.created_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    
    return { conversations: updatedConversations };
  }),
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
  setLoading: (loading) => set({ loading }),
  setUnreadCounts: (counts) => set({ unreadCounts: counts }),
  setUnreadCount: (conversationId, count) => set((state) => ({
    unreadCounts: { ...state.unreadCounts, [conversationId]: count },
  })),
  setReplyingTo: (message) => set({ replyingTo: message }),
  setPendingRequestCount: (count) => set({ pendingRequestCount: count }),
}));

export default useChatStore;
