# Tasks - Fixes, PM Review, & CLI Launcher

- `[x]` Fix settings gear modal opening bug
- `[x]` Update Backend Developer default model to `mimo-v2.5`
- `[x]` Expose process tracking & `cancelCLI` IPC handler
- `[x]` Support Ctrl+C shortcut & cancel-on-clear logic
- `[x]` Implement PM Planning step in `handleSend`
- `[x]` Implement PM instruction & parser for Required Roles
- `[x]` Implement developer execution loop with dynamic role filtering in `handleSend`
- `[x]` Implement PM Review step with target file reading in `handleSend`
- `[ ]` Add `app:get-cli-repo` handler to Electron main process ([index.ts](file:///home/jay/Desktop/Projects/Company/src/main/index.ts))
- `[ ]` Expose `getCliRepo` in preload script ([preload.ts](file:///home/jay/Desktop/Projects/Company/src/main/preload.ts))
- `[ ]` Declare `getCliRepo` in types ([types/index.ts](file:///home/jay/Desktop/Projects/Company/src/renderer/types/index.ts))
- `[ ]` Load CLI repo path on ChatPanel mount ([ChatPanel.tsx](file:///home/jay/Desktop/Projects/Company/src/renderer/components/ChatPanel.tsx))
- `[ ]` Create shell script executable `company-ide` under `~/.local/bin/`
- `[ ]` Verify CLI launch shortcut opens correctly
