import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, FileCode } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import Editor, { loader } from '@monaco-editor/react';

loader.config({ paths: { vs: '/node_modules/monaco-editor/min/vs' } });

export function CodeEditor() {
  const filePath = useWorkspaceStore((s) => s.selectedFilePath);
  const fileContent = useWorkspaceStore((s) => s.selectedFileContent);
  const saveFile = useWorkspaceStore((s) => s.saveFile);
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setContent(fileContent || '');
    setIsDirty(false);
  }, [fileContent, filePath]);

  const handleSave = useCallback(async () => {
    const activeContent = editorRef.current ? editorRef.current.getValue() : content;
    await saveFile(activeContent);
    setIsDirty(false);
  }, [content, saveFile]);

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    setIsDirty(newContent !== (fileContent || ''));
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Add custom save command (Ctrl/Cmd + S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const activeContent = editor.getValue();
      saveFile(activeContent);
      setIsDirty(false);
    });
  };

  if (!filePath) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-900 text-gray-500 min-w-0">
        <div className="text-center">
          <FileCode size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">Select a file from the explorer to view its contents</p>
        </div>
      </main>
    );
  }

  const fileName = filePath.split(/[/\\]/).pop() || '';
  
  // Detect language based on file extension
  const getLanguage = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'py':
        return 'python';
      case 'md':
        return 'markdown';
      case 'sh':
      case 'bash':
        return 'shell';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'xml':
        return 'xml';
      default:
        return 'plaintext';
    }
  };

  const language = getLanguage(filePath);

  return (
    <main className="flex-1 flex flex-col bg-gray-900 min-w-0 h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <FileCode size={14} />
          <span>{fileName}</span>
          {isDirty && <span className="w-2 h-2 rounded-full bg-yellow-500" title="Unsaved changes" />}
        </div>
        {isDirty && (
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            <Save size={12} />
            Save
          </button>
        )}
      </div>

      <div className="flex-1 relative min-h-0 w-full">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            fontFamily: 'Fira Code, Consolas, Monaco, monospace',
            minimap: { enabled: false },
            automaticLayout: true,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            padding: { top: 12 },
            cursorBlinking: 'smooth',
            smoothScrolling: true,
          }}
        />
      </div>
    </main>
  );
}
