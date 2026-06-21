import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isProcessing: boolean;

  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, content: string) => void;
  clearMessages: () => void;
  setProcessing: (value: boolean) => void;
}

const STORAGE_KEY = 'ai-conglomerate-chat-history';

export const useChatStore = create<ChatState>((set) => ({
  messages: (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })(),
  isProcessing: false,

  addMessage: (message) =>
    set((state) => {
      const newMessages = [...state.messages, message];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
      return { messages: newMessages };
    }),

  updateMessage: (id, content) =>
    set((state) => {
      const newMessages = state.messages.map((m) => (m.id === id ? { ...m, content } : m));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
      return { messages: newMessages };
    }),

  clearMessages: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ messages: [] });
  },

  setProcessing: (value) => set({ isProcessing: value }),
}));
