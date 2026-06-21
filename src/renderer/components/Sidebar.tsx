import { FolderOpen, GitBranch, Settings } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useSettingsStore } from '../store/settingsStore';
import { FileTree } from './FileTree';

export function Sidebar() {
  const rootPath = useWorkspaceStore((s) => s.rootPath);
  const fileTree = useWorkspaceStore((s) => s.fileTree);
  const setRootPath = useWorkspaceStore((s) => s.setRootPath);
  const loadFileTree = useWorkspaceStore((s) => s.loadFileTree);
  const toggleSettings = useSettingsStore((s) => s.toggleSettings);

  const handleSelectFolder = async () => {
    if (!window.electronAPI) return;
    const folder = await window.electronAPI.selectFolder();
    if (folder) {
      setRootPath(folder);
      await loadFileTree();
    }
  };

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0">
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Explorer</h2>
        <div className="flex gap-1">
          <button
            onClick={handleSelectFolder}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200"
            title="Open Folder"
          >
            <FolderOpen size={16} />
          </button>
          <button
            onClick={toggleSettings}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {rootPath && (
        <div className="px-3 py-2 text-xs text-gray-500 truncate border-b border-gray-700 flex items-center gap-1">
          <GitBranch size={12} />
          <span>{rootPath}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {!rootPath ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
            <FolderOpen size={32} />
            <p className="text-sm">No folder opened</p>
            <button
              onClick={handleSelectFolder}
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Open a folder
            </button>
          </div>
        ) : (
          <FileTree nodes={fileTree} />
        )}
      </div>

      {rootPath && (
        <div className="p-3 border-t border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <GitBranch size={14} />
            <span>main</span>
          </div>
        </div>
      )}
    </aside>
  );
}
