import { create } from 'zustand';
import type { Agent, ApiKeys } from '../types';

interface SettingsState {
  apiKeys: ApiKeys;
  agents: Agent[];
  isSettingsOpen: boolean;

  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  toggleSettings: () => void;
}

const DEFAULT_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Alice',
    department: 'Product Manager',
    model: 'gpt-5.5',
    systemPrompt: 'You are a Product Manager. Analyze requirements, write specifications, and manage the product backlog.',
  },
  {
    id: '2',
    name: 'Bob',
    department: 'Frontend Developer',
    model: 'deepseek-v4-flash-free',
    systemPrompt: 'You are a Senior Frontend Developer. Write clean React + TypeScript code with TailwindCSS.',
  },
  {
    id: '3',
    name: 'Charlie',
    department: 'Backend Developer',
    model: 'mimo-v2.5',
    systemPrompt: 'You are a Senior Backend Developer. Design APIs, database schemas, and server-side logic.',
  },
];

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKeys: {
    lkpGalaxy: '43|hawOghTpAK2hMVBErxOML8VpoM44DbghQpYuwXVLc8929c1e'
  },
  agents: DEFAULT_AGENTS,
  isSettingsOpen: false,

  setApiKey: (provider, key) =>
    set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),

  addAgent: (agent) =>
    set((state) => ({ agents: [...state.agents, agent] })),

  removeAgent: (id) =>
    set((state) => ({ agents: state.agents.filter((a) => a.id !== id) })),

  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  toggleSettings: () =>
    set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
}));
