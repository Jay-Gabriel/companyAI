import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import type { Agent } from '../types';

export function AgentManager() {
  const agents = useSettingsStore((s) => s.agents);
  const addAgent = useSettingsStore((s) => s.addAgent);
  const removeAgent = useSettingsStore((s) => s.removeAgent);
  const updateAgent = useSettingsStore((s) => s.updateAgent);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Agent>>({});

  const startEdit = (agent: Agent) => {
    setEditingId(agent.id);
    setEditForm(agent);
  };

  const saveEdit = () => {
    if (editingId && editForm.name && editForm.department) {
      updateAgent(editingId, editForm);
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAdd = () => {
    const newAgent: Agent = {
      id: Date.now().toString(),
      name: 'New Agent',
      department: 'New Department',
      model: 'gpt-4',
      systemPrompt: 'You are a helpful AI assistant.',
    };
    addAgent(newAgent);
    startEdit(newAgent);
  };

  return (
    <div className="space-y-3">
      {agents.map((agent) => (
        <div key={agent.id} className="bg-gray-900 rounded-lg p-3 border border-gray-700">
          {editingId === agent.id ? (
            <div className="space-y-2">
              <input
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full bg-gray-800 text-sm rounded px-2 py-1 outline-none border border-gray-600 focus:border-blue-500"
                placeholder="Name"
              />
              <input
                value={editForm.department || ''}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                className="w-full bg-gray-800 text-sm rounded px-2 py-1 outline-none border border-gray-600 focus:border-blue-500"
                placeholder="Department"
              />
              <input
                value={editForm.model || ''}
                onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                className="w-full bg-gray-800 text-sm rounded px-2 py-1 outline-none border border-gray-600 focus:border-blue-500"
                placeholder="Model ID (e.g., gpt-5-codex, deepseek-v4-flash-free)"
              />
              <textarea
                value={editForm.systemPrompt || ''}
                onChange={(e) => setEditForm({ ...editForm, systemPrompt: e.target.value })}
                className="w-full bg-gray-800 text-sm rounded px-2 py-1 outline-none border border-gray-600 focus:border-blue-500 resize-none"
                rows={3}
                placeholder="System prompt..."
              />
              <div className="flex gap-1 justify-end">
                <button onClick={saveEdit} className="p-1 rounded hover:bg-gray-700 text-green-400">
                  <Check size={14} />
                </button>
                <button onClick={cancelEdit} className="p-1 rounded hover:bg-gray-700 text-red-400">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200">{agent.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                    {agent.department}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{agent.model}</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{agent.systemPrompt}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => startEdit(agent)} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => removeAgent(agent.id)} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-1 py-2 text-sm text-gray-400 hover:text-gray-200 border border-dashed border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
      >
        <Plus size={14} />
        Add Agent
      </button>
    </div>
  );
}
