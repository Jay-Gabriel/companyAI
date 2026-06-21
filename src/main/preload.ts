import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('dialog:select-folder'),
  readDirectory: (dirPath: string) => ipcRenderer.invoke('fs:read-directory', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:write-file', filePath, content),
  runCLI: (cliName: string, prompt: string, model?: string, cwd?: string) => ipcRenderer.invoke('app:run-cli', cliName, prompt, model, cwd),
  listFiles: (dirPath: string) => ipcRenderer.invoke('fs:list-files', dirPath),
  cancelCLI: () => ipcRenderer.invoke('app:cancel-cli'),
  getCliRepo: () => ipcRenderer.invoke('app:get-cli-repo'),
});
