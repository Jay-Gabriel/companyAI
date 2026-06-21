import { ChatPanel } from './components/ChatPanel';
import { SettingsDialog } from './components/SettingsDialog';
import { useSettingsStore } from './store/settingsStore';

export default function App() {
  const isSettingsOpen = useSettingsStore((s) => s.isSettingsOpen);
  
  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden font-sans flex flex-col">
      <ChatPanel />
      {isSettingsOpen && <SettingsDialog />}
    </div>
  );
}
