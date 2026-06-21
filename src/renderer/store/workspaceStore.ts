import { create } from 'zustand';
import type { FileNode } from '../types';

interface WorkspaceState {
  rootPath: string | null;
  fileTree: FileNode[];
  selectedFilePath: string | null;
  selectedFileContent: string | null;
  isLoading: boolean;

  setRootPath: (path: string) => void;
  loadFileTree: () => Promise<void>;
  selectFile: (filePath: string) => Promise<void>;
  saveFile: (content: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  rootPath: null,
  fileTree: [],
  selectedFilePath: null,
  selectedFileContent: null,
  isLoading: false,

  setRootPath: (path) => set({ rootPath: path }),

  loadFileTree: async () => {
    const { rootPath } = get();
    if (!rootPath || !window.electronAPI) return;
    set({ isLoading: true });
    const fileTree = await window.electronAPI.readDirectory(rootPath);
    set({ fileTree, isLoading: false });
  },

  selectFile: async (filePath) => {
    if (!window.electronAPI) return;
    set({ selectedFilePath: filePath, isLoading: true });
    const content = await window.electronAPI.readFile(filePath);
    set({ selectedFileContent: content, isLoading: false });
  },

  saveFile: async (content) => {
    const { selectedFilePath } = get();
    if (!selectedFilePath || !window.electronAPI) return;
    await window.electronAPI.writeFile(selectedFilePath, content);
    set({ selectedFileContent: content });
  },
}));
