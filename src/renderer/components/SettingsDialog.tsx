import { X, Key, Bot } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { AgentManager } from './AgentManager';

export function SettingsDialog() {
  const toggleSettings = useSettingsStore((s) => s.toggleSettings);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const setApiKey = useSettingsStore((s) => s.setApiKey);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl w-[600px] max-h-[80vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
          <button
            onClick={toggleSettings}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
              <Key size={16} />
              API Key Vault
            </h3>
            <div className="space-y-3">
              {[
                { key: 'opencode', label: 'OpenCode Zen (Free DeepSeek V4 / GPT 5.5 / MiniMax M3 / Mimo V2.5)' },
                { key: 'openai', label: 'OpenAI (GPT-5.5 / GPT-4)' },
                { key: 'deepseek', label: 'DeepSeek' },
                { key: 'lkpGalaxy', label: 'LKP Galaxy / MiniMax (Local Proxy)' },
                { key: 'anthropic', label: 'Anthropic (Claude)' },
                { key: 'qwen', label: 'Qwen' },
                { key: 'google', label: 'Google (Gemini)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input
                    type="password"
                    value={apiKeys[key as keyof typeof apiKeys] || ''}
                    onChange={(e) => setApiKey(key as keyof typeof apiKeys, e.target.value)}
                    placeholder={key === 'lkpGalaxy' ? 'Defaults to active gateway key...' : `Enter ${label} API key...`}
                    className="w-full bg-gray-900 text-gray-100 text-sm rounded-lg px-3 py-2 outline-none border border-gray-600 focus:border-blue-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-gray-700" />

          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
              <Bot size={16} />
              AI Personnel
            </h3>
            <AgentManager />
          </section>
        </div>
      </div>
    </div>
  );
}
