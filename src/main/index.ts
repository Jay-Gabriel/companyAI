import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ── IPC Handlers ──────────────────────────────────────────────────────────

ipcMain.handle('dialog:select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('fs:read-directory', async (_event, dirPath: string) => {
  try {
    return buildFileTree(dirPath);
  } catch (err) {
    console.error('Error reading directory:', err);
    return [];
  }
});

ipcMain.handle('fs:read-file', async (_event, filePath: string) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error('Error reading file:', err);
    return null;
  }
});

ipcMain.handle('fs:write-file', async (_event, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing file:', err);
    return false;
  }
});

function listAllFiles(dirPath: string, rootDir: string = dirPath): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(listAllFiles(fullPath, rootDir));
    } else {
      files.push(path.relative(rootDir, fullPath));
    }
  }
  return files;
}

ipcMain.handle('fs:list-files', async (_event, dirPath: string) => {
  try {
    return listAllFiles(dirPath);
  } catch (err) {
    console.error('Error listing files:', err);
    return [];
  }
});

let activeChild: any = null;

ipcMain.handle('app:cancel-cli', async () => {
  if (activeChild) {
    try {
      activeChild.kill('SIGINT');
      activeChild = null;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
  return { success: true };
});

ipcMain.handle('app:run-cli', async (_event, cliName: string, prompt: string, model?: string, cwd?: string) => {
  const { execFile } = require('child_process');
  
  return new Promise((resolve) => {
    let file = '';
    let args: string[] = [];
    
    if (cliName === 'codex') {
      file = 'codex';
      args = ['exec', '--skip-git-repo-check', prompt];
      if (model) {
        args.push('-m', model);
      }
    } else if (cliName === 'opencode') {
      file = '/home/jay/.opencode/bin/opencode';
      args = ['run', '--pure', '--dangerously-skip-permissions', prompt];
      if (model) {
        args.push('-m', model);
      }
    } else if (cliName === 'mimo') {
      file = '/home/jay/.mimocode/bin/mimo';
      args = ['run', '--pure', '--dangerously-skip-permissions', prompt];
      if (model) {
        args.push('-m', model);
      }
    } else {
      resolve({ success: false, error: 'Unknown CLI' });
      return;
    }
    
    const execOptions: any = { maxBuffer: 10 * 1024 * 1024 };
    if (cwd) {
      execOptions.cwd = cwd;
    }
    
    const child = execFile(file, args, execOptions, (error: any, stdout: string, stderr: string) => {
      activeChild = null;
      if (error) {
        const isCancelled = error.signal === 'SIGINT' || error.killed;
        resolve({ 
          success: false, 
          error: isCancelled ? 'Execution cancelled by user.' : (stderr || error.message), 
          stdout 
        });
      } else {
        resolve({ success: true, stdout });
      }
    });

    activeChild = child;

    if (child.stdin) {
      child.stdin.end();
    }
  });
});

function buildFileTree(dirPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const tree: any[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      tree.push({
        name: entry.name,
        path: fullPath,
        type: 'directory',
        children: buildFileTree(fullPath),
      });
    } else {
      tree.push({ name: entry.name, path: fullPath, type: 'file' });
    }
  }

  tree.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return tree;
}
