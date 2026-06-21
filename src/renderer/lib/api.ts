export async function callAgentLLM(
  model: string,
  systemPrompt: string,
  userMessage: string,
  apiKeys: Record<string, string | undefined>,
  cwd?: string
): Promise<string> {
  const electronAPI = window.electronAPI;

  // 1. If running in Electron, use local CLI executables directly (NO keys required)
  if (electronAPI?.runCLI) {
    const cliPrompt = `System instructions: ${systemPrompt}\n\nUser request: ${userMessage}`;
    const m = model.toLowerCase();
    const cleanModel = m.replace(/[\s\-_]+/g, '');
    
    // Codex CLI (OpenAI models)
    if (cleanModel.includes('gpt') || cleanModel.includes('codex') || cleanModel.includes('chatgpt')) {
      const res = await electronAPI.runCLI('codex', cliPrompt, model, cwd);
      if (!res.success) {
        throw new Error(res.error || 'Failed to run Codex CLI');
      }
      return cleanCodexOutput(res.stdout || '');
    } 
    
    // Mimo CLI (Mimo / Xiaomi models)
    if (cleanModel.includes('mimo/') || cleanModel.includes('xiaomi/') || cleanModel.includes('mimoauto') || cleanModel === 'mimo' || cleanModel.includes('mimov3')) {
      const modelId = cleanModel.includes('xiaomi/') ? model : 'mimo/mimo-auto';
      const res = await electronAPI.runCLI('mimo', cliPrompt, modelId, cwd);
      if (!res.success) {
        throw new Error(res.error || 'Failed to run Mimo CLI');
      }
      return cleanOpencodeOutput(res.stdout || '');
    }
    
    // OpenCode CLI (OpenCode / Galaxy / Minimax models)
    if (
      cleanModel.includes('deepseek') || 
      cleanModel.includes('opencode') || 
      cleanModel.includes('minimax') || 
      cleanModel.includes('nemotron') || 
      cleanModel.includes('north') || 
      cleanModel.includes('pickle') ||
      cleanModel.includes('m3') ||
      cleanModel.includes('mimov2.5') ||
      cleanModel.includes('mimo2.5')
    ) {
      let modelId = model;
      if (cleanModel.includes('deepseekv4') || cleanModel === 'deepseek') {
        modelId = 'opencode/deepseek-v4-flash-free';
      } else if (cleanModel.includes('minimaxm3') || cleanModel.includes('minimax') || cleanModel.includes('m3')) {
        modelId = 'lkp-galaxy/MiniMax-M3';
      } else if (cleanModel.includes('mimov2.5') || cleanModel.includes('mimo2.5')) {
        modelId = 'opencode/mimo-v2.5-free';
      }
      
      const res = await electronAPI.runCLI('opencode', cliPrompt, modelId, cwd);
      if (!res.success) {
        throw new Error(res.error || 'Failed to run OpenCode CLI');
      }
      return cleanOpencodeOutput(res.stdout || '');
    }
  }

  // 2. Fallback to direct HTTP fetch if not running inside Electron TUI (using API keys)
  let url = '';
  let apiKey = '';
  let selectedModel = model;

  const isLocalMinimax = model === 'minimax-m3-free' || model.toLowerCase().includes('minimax') || model.toLowerCase().includes('mimo');

  if (isLocalMinimax && !apiKeys.opencode) {
    url = 'http://127.0.0.1:8999/v1/chat/completions';
    apiKey = apiKeys.lkpGalaxy || '43|hawOghTpAK2hMVBErxOML8VpoM44DbghQpYuwXVLc8929c1e';
    selectedModel = 'MiniMax-M3';
  } else if (apiKeys.opencode) {
    url = 'https://opencode.ai/zen/v1/chat/completions';
    apiKey = apiKeys.opencode;
    selectedModel = model;
  } else {
    if (model.toLowerCase().includes('deepseek')) {
      url = 'https://api.deepseek.com/v1/chat/completions';
      apiKey = apiKeys.deepseek || '';
      selectedModel = 'deepseek-chat';
    } else if (model.toLowerCase().includes('gpt-') || model.toLowerCase().includes('chatgpt')) {
      url = 'https://api.openai.com/v1/chat/completions';
      apiKey = apiKeys.openai || '';
      selectedModel = model.includes('5.5') ? 'gpt-4o' : model;
    } else {
      url = 'http://127.0.0.1:8999/v1/chat/completions';
      apiKey = apiKeys.lkpGalaxy || '43|hawOghTpAK2hMVBErxOML8VpoM44DbghQpYuwXVLc8929c1e';
      selectedModel = 'MiniMax-M3';
    }
  }

  if (!apiKey) {
    throw new Error(`API key is missing. Click the settings gear icon at the top of the Left Explorer panel to enter your API key.`);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError = errorText;
    try {
      const errJson = JSON.parse(errorText);
      parsedError = errJson.error?.message || errJson.message || errorText;
    } catch {
      // ignore
    }
    throw new Error(parsedError);
  }

  const data = await response.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }
  
  throw new Error('Invalid response structure from LLM provider.');
}

// Helpers to extract cleaner agent responses from CLI outputs
function cleanCodexOutput(stdout: string): string {
  const parts = stdout.split(/\r?\ncodex\r?\n/);
  if (parts.length < 2) return stdout.trim();
  
  const responsePart = parts[1];
  const finalParts = responsePart.split(/\r?\ntokens used/);
  return finalParts[0].trim();
}

function cleanOpencodeOutput(stdout: string): string {
  const lines = stdout.split('\n');
  const cleaned: string[] = [];
  let isSkippingCommandOutput = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip command wrapper and run executions
    if (trimmed.startsWith('> ') || trimmed.startsWith('$ ')) {
      isSkippingCommandOutput = true;
      continue;
    }
    
    // Skip file system operations and status indicators
    if (
      trimmed.startsWith('→ ') || 
      trimmed.startsWith('← ') || 
      trimmed === 'Wrote file successfully.' || 
      trimmed === '(no output)'
    ) {
      continue;
    }
    
    // Skip Todo check-lists from autonomous agents
    if (
      trimmed === '# Todos' || 
      trimmed.startsWith('[•]') || 
      trimmed.startsWith('[ ]') || 
      trimmed.startsWith('[✓]')
    ) {
      continue;
    }
    
    // Skip intermediate setup/log/test/curl messages
    if (isSkippingCommandOutput) {
      if (
        trimmed.startsWith('npm warn') || 
        trimmed.includes('packages are looking for funding') || 
        trimmed.includes('run `npm fund`') || 
        trimmed.includes('severity vulnerability') || 
        trimmed.includes('npm audit') ||
        trimmed.startsWith('Server running on') ||
        trimmed.startsWith('Testing API...') ||
        trimmed.startsWith('{') || 
        trimmed.startsWith('added ') || 
        trimmed.includes('audited ') ||
        trimmed.includes('deprecated')
      ) {
        continue;
      }
    }
    
    cleaned.push(line);
  }
  
  return cleaned.join('\n').trim();
}
