import { create } from "zustand";

interface ChatState {
  activeConversationId: string | null;
  searchQuery: string;
  setActiveConversationId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  searchQuery: "",
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
