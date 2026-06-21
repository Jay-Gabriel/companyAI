import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';
import type { FileNode } from '../types';
import { useWorkspaceStore } from '../store/workspaceStore';

interface FileTreeProps {
  nodes: FileNode[];
  depth?: number;
}

export function FileTree({ nodes, depth = 0 }: FileTreeProps) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNode key={node.path} node={node} depth={depth} />
      ))}
    </ul>
  );
}

function TreeNode({ node, depth }: { node: FileNode; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const selectFile = useWorkspaceStore((s) => s.selectFile);
  const selectedFilePath = useWorkspaceStore((s) => s.selectedFilePath);

  const isDirectory = node.type === 'directory';
  const isSelected = node.path === selectedFilePath;

  const handleClick = () => {
    if (isDirectory) {
      setExpanded(!expanded);
    } else {
      selectFile(node.path);
    }
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
          isSelected
            ? 'bg-blue-600/20 text-blue-300'
            : 'text-gray-300 hover:bg-gray-700/50'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDirectory ? (
          <>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={14} className="text-yellow-500" />
          </>
        ) : (
          <>
            <span className="w-4" />
            <File size={14} className="text-blue-400" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDirectory && expanded && node.children && (
        <FileTree nodes={node.children} depth={depth + 1} />
      )}
    </li>
  );
}
