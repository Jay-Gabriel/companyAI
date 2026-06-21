# Implementation Plan - PM Code Review Loop and Dynamic Role Filtering

We will implement a Product Manager review loop and a dynamic developer role-skipping mechanism based on the PM's plan specifications.

## Proposed Changes

### Electron Renderer Components

#### [MODIFY] [ChatPanel.tsx](file:///home/jay/Desktop/Projects/Company/src/renderer/components/ChatPanel.tsx)
- **PM Planning & Instruction:** When requesting the PM (Alice) to design the plan, append a directive instructing her to state which roles are required at the very start of her response (e.g. `[Required Roles: Frontend]`).
- **Dynamic Role Skipping:** After the PM planning step is done, parse this required roles header. Filter the list of developers `devsToRun` so that only the requested roles (Frontend and/or Backend) are executed. If a role is not requested, its execution is skipped entirely, saving execution time and API limits.
- **Meticulous Review Loop:** Run the sequential developer execution and PM code review loop (maximum 2 iterations) for active roles. Feed target files into the PM's review context. If Alice writes `[APPROVED]`, complete the task; otherwise, let devs run a second cycle to fix the listed issues.

## Verification Plan

### Manual Verification
1. Run `npm run dev` to start the app.
2. Direct the PM to only do Frontend changes (e.g., "Add a Frontend button, no backend needed").
3. Verify that the PM planning response includes `[Required Roles: Frontend]`.
4. Verify that only Bob (Frontend Developer) executes in the chat flow, and Charlie (Backend Developer) is completely skipped.
