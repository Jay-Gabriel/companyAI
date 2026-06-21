export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface Agent {
  id: string;
  name: string;
  department: string;
  model: string;
  systemPrompt: string;
}

export interface ApiKeys {
  anthropic?: string;
  openai?: string;
  qwen?: string;
  google?: string;
  deepseek?: string;
  lkpGalaxy?: string;
  opencode?: string;
}

export interface ChatMessage {
  id: string;
  role: 'ceo' | 'agent';
  agentId?: string;
  agentName?: string;
  department?: string;
  content: string;
  timestamp: number;
}

export interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  readDirectory: (dirPath: string) => Promise<FileNode[]>;
  readFile: (filePath: string) => Promise<string | null>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  runCLI: (cliName: string, prompt: string, model?: string, cwd?: string) => Promise<{ success: boolean; error?: string; stdout?: string }>;
  listFiles: (dirPath: string) => Promise<string[]>;
  cancelCLI: () => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
