# Implementation Plan - CLI Terminal Launch Shortcut (company-ide)

We will implement a terminal launch shortcut `company-ide`. Users will be able to type `company-ide <path>` in any terminal to launch the Electron app with that directory automatically loaded and indexed.

## Proposed Changes

### Electron Main Process

#### [MODIFY] [index.ts](file:///home/jay/Desktop/Projects/Company/src/main/index.ts)
- Register `app:get-cli-repo` IPC handler.
- Parse `process.argv` to find the first argument that is an existing local directory. Return the absolute path of this directory (or `null` if none).

#### [MODIFY] [preload.ts](file:///home/jay/Desktop/Projects/Company/src/main/preload.ts)
- Expose the method to Electron API: `getCliRepo: () => ipcRenderer.invoke('app:get-cli-repo')`.

### Electron Renderer Process

#### [MODIFY] [types/index.ts](file:///home/jay/Desktop/Projects/Company/src/renderer/types/index.ts)
- Declare `getCliRepo` in the `ElectronAPI` interface type definitions.

#### [MODIFY] [ChatPanel.tsx](file:///home/jay/Desktop/Projects/Company/src/renderer/components/ChatPanel.tsx)
- Add a `useEffect` on mount that queries `window.electronAPI.getCliRepo()`.
- If a path is returned, set `rootPath` to automatically load and index the workspace.

### System Configuration

#### [NEW] [company-ide](file:///home/jay/.local/bin/company-ide)
- Create a bash script that:
  1. Resolves the first CLI argument to an absolute directory path.
  2. Spawns `npx electron <app-dir> <path>` in the background.
  3. Disowns/redirects stdout to `/dev/null` to keep the terminal interactive and clean.

## Verification Plan

### Manual Verification
1. Run `npm run build` to compile the app.
2. Run `/home/jay/.local/bin/company-ide /home/jay/Desktop/Projects/Company` in terminal.
3. Confirm that the application opens and automatically loads the workspace repository.
