import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot, Users, FolderOpen, Settings, FileText } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { ChatMessage } from './ChatMessage';
import { callAgentLLM } from '../lib/api';

export function ChatPanel() {
  const [input, setInput] = useState('');
  const [targetFiles, setTargetFiles] = useState('');
  const [repoFiles, setRepoFiles] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestQuery, setSuggestQuery] = useState('');
  const [suggestIndex, setSuggestIndex] = useState(0);

  const { messages, addMessage, updateMessage, clearMessages, isProcessing, setProcessing } = useChatStore();
  
  const agents = useSettingsStore((s) => s.agents);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const toggleSettings = useSettingsStore((s) => s.toggleSettings);
  
  const rootPath = useWorkspaceStore((s) => s.rootPath);
  const setRootPath = useWorkspaceStore((s) => s.setRootPath);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCancel = async () => {
    if (window.electronAPI?.cancelCLI) {
      await window.electronAPI.cancelCLI();
    }
    setProcessing(false);
  };

  const handleClearMessages = async () => {
    clearMessages();
    if (isProcessing) {
      setProcessing(false);
      if (window.electronAPI?.cancelCLI) {
        await window.electronAPI.cancelCLI();
      }
    }
  };

  // Keyboard shortcut listener for Ctrl+C to cancel running process
  useEffect(() => {
    const handleGlobalKeyDown = async (e: KeyboardEvent) => {
      if (isProcessing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        await handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isProcessing]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial repository from CLI arguments if present
  useEffect(() => {
    const loadCliRepo = async () => {
      if (window.electronAPI?.getCliRepo) {
        const repo = await window.electronAPI.getCliRepo();
        if (repo) {
          setRootPath(repo);
        }
      }
    };
    loadCliRepo();
  }, [setRootPath]);

  // Load and index repository files recursively on rootPath change
  useEffect(() => {
    const fetchFiles = async () => {
      if (rootPath && window.electronAPI?.listFiles) {
        try {
          const files = await window.electronAPI.listFiles(rootPath);
          setRepoFiles(files);
        } catch (err) {
          console.error('Failed to list files:', err);
          setRepoFiles([]);
        }
      } else {
        setRepoFiles([]);
      }
    };
    fetchFiles();
  }, [rootPath]);

  const handleSelectFolder = async () => {
    if (!window.electronAPI) return;
    const folder = await window.electronAPI.selectFolder();
    if (folder) {
      setRootPath(folder);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const ceoMessage = {
      id: Date.now().toString(),
      role: 'ceo' as const,
      content: input.trim(),
      timestamp: Date.now(),
    };

    addMessage(ceoMessage);
    const userPrompt = input.trim();
    setInput('');
    setProcessing(true);
    setShowSuggest(false);

    // Context that accumulates agent responses as they execute
    let conversationContext = `CEO (User) Directive: "${userPrompt}"\n\n`;

    // Check if user tagged any specific agents (e.g. @Alice, @Bob, @pm, @fe, @be)
    const checkTagged = (agent: typeof agents[0]) => {
      const text = userPrompt.toLowerCase();
      const nameTag = `@${agent.name.toLowerCase()}`;
      const deptTag = `@${agent.department.toLowerCase()}`;
      
      const shortTags: string[] = [];
      if (agent.department.toLowerCase().includes('product manager')) {
        shortTags.push('@pm');
      }
      if (agent.department.toLowerCase().includes('frontend')) {
        shortTags.push('@frontend', '@fe');
      }
      if (agent.department.toLowerCase().includes('backend')) {
        shortTags.push('@backend', '@be');
      }
      
      return text.includes(nameTag) || text.includes(deptTag) || shortTags.some(t => text.includes(t));
    };

    const hasAnyTag = agents.some(checkTagged);
    const activeAgents = hasAnyTag ? agents.filter(checkTagged) : agents;

    const pmAgent = agents.find(a => a.department.toLowerCase().includes('product manager'));
    const isPmActive = activeAgents.some(a => a.department.toLowerCase().includes('product manager'));
    const hasDevelopers = activeAgents.some(a => 
      a.department.toLowerCase().includes('frontend') || 
      a.department.toLowerCase().includes('backend')
    );

    // Filter developer agents that need to execute
    let devsToRun = activeAgents.filter(a => 
      a.department.toLowerCase().includes('frontend') || 
      a.department.toLowerCase().includes('backend')
    );

    // 1. PM Planning Step (Run first if PM is active in this request)
    const activePm = activeAgents.find(a => a.department.toLowerCase().includes('product manager'));
    if (activePm && isProcessing) {
      const msgId = `${Date.now()}-${activePm.id}-plan`;
      const planMessage = {
        id: msgId,
        role: 'agent' as const,
        agentId: activePm.id,
        agentName: activePm.name,
        department: activePm.department,
        content: `**${activePm.department}** (using ${activePm.model}) is designing the specifications and plan...\n\n*Thinking...*`,
        timestamp: Date.now(),
      };
      addMessage(planMessage);

      try {
        const contextHeader = `[Target Workspace Repository]: ${rootPath || 'Not specified'}\n[Target File(s) to edit/review]: ${targetFiles || 'Not specified'}\n\n`;
        const promptForPm = `${contextHeader}User Request: ${userPrompt}\n\nIMPORTANT: At the very beginning of your planning response, you MUST specify which developer roles are required to execute this plan. Use this exact format:
[Required Roles: Frontend, Backend]
or [Required Roles: Frontend]
or [Required Roles: Backend]
or [Required Roles: None]`;

        const response = await callAgentLLM(
          activePm.model, 
          activePm.systemPrompt, 
          promptForPm, 
          apiKeys as Record<string, string | undefined>,
          rootPath || undefined
        );
        updateMessage(msgId, response);
        conversationContext += `=== Product Manager Plan (${activePm.name}) ===\n${response}\n\n`;

        // Parse required roles if specified by the PM
        const rolesMatch = response.match(/\[Required Roles:\s*([^\]]+)\]/i);
        if (rolesMatch) {
          const rolesStr = rolesMatch[1].toLowerCase();
          const requiredFrontend = rolesStr.includes('frontend') || rolesStr.includes('fe');
          const requiredBackend = rolesStr.includes('backend') || rolesStr.includes('be');
          
          devsToRun = devsToRun.filter(a => {
            if (a.department.toLowerCase().includes('frontend')) {
              return requiredFrontend;
            }
            if (a.department.toLowerCase().includes('backend')) {
              return requiredBackend;
            }
            return true;
          });
        }
      } catch (err: any) {
        const errorMsg = `**Error from ${activePm.name} (${activePm.model}):**\n\n${err.message || err}`;
        updateMessage(msgId, errorMsg);
        conversationContext += `=== Product Manager Plan (${activePm.name}) ===\n(Failed to respond due to error: ${err.message})\n\n`;
        if (err.message === 'Execution cancelled by user.') {
          setProcessing(false);
          return;
        }
      }
    }

    // 2. Loop Execution for Developers and PM Code Review
    let loopIteration = 0;
    const maxReviewIterations = 2; // Capped at 2 loops maximum to prevent endless cycles
    let needsReview = isPmActive && hasDevelopers;
    let lastReviewComments = '';

    // If no PM is active but developers are tagged, we run them sequentially exactly once (needsReview = false)
    if (!isPmActive && hasDevelopers) {
      needsReview = false;
      loopIteration = 0; // Run devs once below
    }

    do {
      loopIteration++;
      
      // A. Run active developers sequentially
      if (devsToRun.length > 0) {
        for (let i = 0; i < devsToRun.length; i++) {
          // Check cancellation
          if (!useChatStore.getState().isProcessing) {
            break;
          }

          const agent = devsToRun[i];
          const suffix = needsReview ? ` - Loop ${loopIteration}` : '';
          const msgId = `${Date.now()}-${agent.id}-cycle-${loopIteration}`;
          
          const actionText = loopIteration > 1 ? 'is applying fixes' : 'is implementing';
          const agentMessage = {
            id: msgId,
            role: 'agent' as const,
            agentId: agent.id,
            agentName: agent.name,
            department: `${agent.department}${suffix}`,
            content: `**${agent.department}** (using ${agent.model}) ${actionText}...\n\n*Thinking...*`,
            timestamp: Date.now(),
          };
          addMessage(agentMessage);

          try {
            // Read target files to give current state context
            let fileContexts = '';
            if (targetFiles && window.electronAPI?.readFile) {
              const files = targetFiles.split(',').map(f => f.trim());
              for (const f of files) {
                if (f && rootPath) {
                  const fullPath = `${rootPath}/${f}`;
                  const content = await window.electronAPI.readFile(fullPath);
                  if (content) {
                    fileContexts += `=== Current File Content of ${f} ===\n${content}\n\n`;
                  }
                }
              }
            }

            const contextHeader = `[Target Workspace Repository]: ${rootPath || 'Not specified'}\n[Target File(s) to edit/review]: ${targetFiles || 'Not specified'}\n\n${fileContexts}`;

            let promptForAgent = '';
            if (loopIteration === 1) {
              promptForAgent = `${contextHeader}User Request: ${userPrompt}\n\nHere is the current plan/progress context:\n${conversationContext}\nPlease implement your part.`;
            } else {
              promptForAgent = `${contextHeader}The Product Manager reviewed the code and requested these fixes:\n\n${lastReviewComments}\n\nHere is the progress context:\n${conversationContext}\nPlease apply the fixes now.`;
            }

            const response = await callAgentLLM(
              agent.model, 
              agent.systemPrompt, 
              promptForAgent, 
              apiKeys as Record<string, string | undefined>,
              rootPath || undefined
            );
            updateMessage(msgId, response);
            conversationContext += `=== ${agent.department} (${agent.name}) - Cycle ${loopIteration} ===\n${response}\n\n`;
          } catch (err: any) {
            const errorMsg = `**Error from ${agent.name} (${agent.model}):**\n\n${err.message || err}`;
            updateMessage(msgId, errorMsg);
            conversationContext += `=== ${agent.department} (${agent.name}) ===\n(Failed to respond due to error: ${err.message})\n\n`;
            if (err.message === 'Execution cancelled by user.') {
              needsReview = false;
              break;
            }
          }
        }
      }

      // Check cancellation again
      if (!useChatStore.getState().isProcessing) {
        break;
      }

      // B. Run Alice (PM) to Review the implementation (Only if review loop is active)
      if (needsReview && pmAgent) {
        const reviewMsgId = `${Date.now()}-${pmAgent.id}-review-${loopIteration}`;
        const reviewMessage = {
          id: reviewMsgId,
          role: 'agent' as const,
          agentId: pmAgent.id,
          agentName: pmAgent.name,
          department: `${pmAgent.department} (Reviewer)`,
          content: `**${pmAgent.department}** (using ${pmAgent.model}) is conducting a code review of target files (Cycle ${loopIteration}/${maxReviewIterations})...\n\n*Reviewing code...*`,
          timestamp: Date.now(),
        };
        addMessage(reviewMessage);

        try {
          // Read target files to let PM review the updated code
          let fileContexts = '';
          if (targetFiles && window.electronAPI?.readFile) {
            const files = targetFiles.split(',').map(f => f.trim());
            for (const f of files) {
              if (f && rootPath) {
                const fullPath = `${rootPath}/${f}`;
                const content = await window.electronAPI.readFile(fullPath);
                if (content) {
                  fileContexts += `=== Updated File Content of ${f} ===\n${content}\n\n`;
                }
              }
            }
          }

          const contextHeader = `[Target Workspace Repository]: ${rootPath || 'Not specified'}\n[Target File(s) to edit/review]: ${targetFiles || 'Not specified'}\n\n${fileContexts}`;

          const pmSystemPrompt = `You are an extremely meticulous Product Manager & Quality Assurance Lead.
Your goal is to inspect the code changes of Bob (Frontend) and Charlie (Backend) with absolute precision.
Check for:
1. Missing requirements.
2. Incomplete backend APIs, incorrect status codes, or missing error handling.
3. Frontend state bugs, empty loading states, or missing hooks.
4. Edge cases and logical errors.
Be strict! Do NOT approve (do NOT write [APPROVED]) if there is even a minor bug or incomplete feature.
However, to avoid endless loops, ensure your feedback is highly actionable, clear, and specific. If everything is correct, fully functional, and matches requirements, write [APPROVED] at the very end of your review.`;

          const promptForPm = `${contextHeader}Please review the updated code changes from the developer agents.\n\nHere is the conversation context:\n${conversationContext}\n\nDetermine if the code changes meet the requirements. If approved, make sure to write [APPROVED] at the end. Otherwise, list the exact points the developers need to fix.`;

          const response = await callAgentLLM(
            pmAgent.model, 
            pmSystemPrompt, 
            promptForPm, 
            apiKeys as Record<string, string | undefined>,
            rootPath || undefined
          );
          updateMessage(reviewMsgId, response);
          conversationContext += `=== PM Review (${pmAgent.name}) - Loop ${loopIteration} ===\n${response}\n\n`;

          if (response.includes('[APPROVED]') || loopIteration >= maxReviewIterations) {
            needsReview = false;
          } else {
            lastReviewComments = response;
            needsReview = true;
          }
        } catch (err: any) {
          const errorMsg = `**Error from PM Reviewer (${pmAgent.model}):**\n\n${err.message || err}`;
          updateMessage(reviewMsgId, errorMsg);
          needsReview = false;
          break;
        }
      } else {
        needsReview = false; // Non-PM loop finishes after 1 iteration
      }

    } while (needsReview && loopIteration < maxReviewIterations);

    setProcessing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, selectionStart);
    
    // Check if the current word before the cursor starts with '/'
    const match = textBeforeCursor.match(/\/([^\s]*)$/);
    if (match) {
      setShowSuggest(true);
      setSuggestQuery(match[1]);
      setSuggestIndex(0);
    } else {
      setShowSuggest(false);
    }
  };

  const selectSuggestion = (filePath: string) => {
    if (!textareaRef.current) return;
    const value = input;
    const selectionStart = textareaRef.current.selectionStart;
    const textBeforeCursor = value.slice(0, selectionStart);
    const textAfterCursor = value.slice(selectionStart);
    
    // Replace the word starting with '/' with the actual file path
    const newTextBeforeCursor = textBeforeCursor.replace(/\/([^\s]*)$/, filePath);
    const newValue = newTextBeforeCursor + textAfterCursor;
    
    setInput(newValue);
    setShowSuggest(false);
    
    // Refocus and place cursor exactly after the inserted file path
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = newTextBeforeCursor.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggest && filteredFiles.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestIndex((prev) => (prev + 1) % filteredFiles.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestIndex((prev) => (prev - 1 + filteredFiles.length) % filteredFiles.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectSuggestion(filteredFiles[suggestIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggest(false);
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter repository files matching the query (capped at 10 results for clean UI)
  const filteredFiles = repoFiles
    .filter(file => file.toLowerCase().includes(suggestQuery.toLowerCase()))
    .slice(0, 10);

  return (
    <aside className="flex-1 bg-gray-900 flex flex-col min-w-0 h-full relative">
      {/* Premium Header Bar */}
      <div className="p-4 bg-gray-800 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <Bot size={22} className="text-emerald-400 animate-pulse" />
          <div>
            <h1 className="text-base font-bold text-gray-100">AI Conglomerate Command Center</h1>
            <p className="text-xs text-gray-500">Multi-Agent Repository Orchestration</p>
          </div>
        </div>

        {/* Directory & Files Controls */}
        <div className="flex flex-wrap items-center gap-3 flex-1 md:justify-end">
          {/* Repository Selector */}
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 gap-2 max-w-sm">
            <FolderOpen size={16} className="text-blue-400 flex-shrink-0" />
            <span className="text-xs text-gray-300 truncate max-w-[200px]" title={rootPath || 'No repository selected'}>
              {rootPath ? rootPath.split(/[/\\]/).pop() : 'No repository selected'}
            </span>
            <button
              onClick={handleSelectFolder}
              className="text-xs font-semibold text-blue-500 hover:text-blue-400 bg-gray-800 px-2 py-0.5 rounded border border-gray-700 transition-colors"
            >
              Select Repo
            </button>
          </div>

          {/* Target Files Input */}
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 gap-2 w-full md:w-64">
            <FileText size={16} className="text-amber-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Target file(s) (e.g. src/index.ts)"
              value={targetFiles}
              onChange={(e) => setTargetFiles(e.target.value)}
              className="bg-transparent text-xs text-gray-200 outline-none w-full"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-900 border border-gray-700 px-2 py-1.5 rounded-lg">
            <Users size={14} className="text-gray-400" />
            <span className="font-semibold text-gray-300">{agents.length} Agents</span>
          </span>
          
          <button
            onClick={toggleSettings}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 transition-all"
            title="Open Settings"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={handleClearMessages}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400 border border-gray-700 transition-all"
            title="Clear conversation"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 bg-gray-850 border-b border-gray-750 flex gap-2 overflow-x-auto">
        {agents.map((agent) => (
          <span
            key={agent.id}
            className="text-xs px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300 whitespace-nowrap"
          >
            {agent.name} ({agent.department})
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
            <Bot size={48} className="opacity-40 text-emerald-400 animate-bounce" />
            <h2 className="text-sm font-semibold text-gray-300">Issue directives to your AI team</h2>
            <p className="text-xs text-gray-500 max-w-sm text-center">
              Select a repository, type targeted files above, and tag specific agents using <span className="text-emerald-400">@pm</span>, <span className="text-emerald-400">@fe</span>, or <span className="text-emerald-400">@be</span>.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isProcessing && (
          <div className="flex items-center justify-between gap-4 text-gray-400 text-sm p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="animate-spin w-4.5 h-4.5 border-2 border-emerald-500 border-t-transparent rounded-full" />
              <span>Agents are orchestrating and implementing your request...</span>
            </div>
            <button
              onClick={handleCancel}
              className="text-xs font-semibold bg-red-950/40 hover:bg-red-950/60 hover:text-red-300 text-red-400 px-3 py-1.5 rounded-lg border border-red-900/50 transition-all hover:scale-102 hover:shadow active:scale-98"
            >
              Cancel (Ctrl+C)
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions Autocomplete Popup */}
      {showSuggest && filteredFiles.length > 0 && (
        <div className="absolute bottom-[130px] left-4 right-4 bg-gray-850 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-20 max-h-60 overflow-y-auto backdrop-blur-md bg-opacity-95">
          <div className="px-3 py-1.5 bg-gray-800 border-b border-gray-700 text-[10px] text-gray-400 font-semibold tracking-wider uppercase flex items-center justify-between">
            <span>Repository files (matching "{suggestQuery}")</span>
            <span>↑↓ selection • Enter / Tab to select</span>
          </div>
          <ul className="divide-y divide-gray-750">
            {filteredFiles.map((file, idx) => (
              <li key={file}>
                <button
                  onClick={() => selectSuggestion(file)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                    idx === suggestIndex ? 'bg-emerald-600 text-white font-medium' : 'text-gray-300 hover:bg-gray-850'
                  }`}
                >
                  <FileText size={14} className={idx === suggestIndex ? 'text-white' : 'text-amber-400'} />
                  <span className="truncate">{file}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-4 border-t border-gray-700 bg-gray-850">
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your directive to the AI team... Type '/' to list files in repo (Ctrl+Enter to send)"
            className="flex-1 bg-gray-900 text-gray-100 text-sm rounded-xl px-4 py-3 resize-none outline-none border border-gray-700 focus:border-emerald-500 transition-colors shadow-inner"
            rows={3}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="self-end p-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl transition-all shadow-md flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
