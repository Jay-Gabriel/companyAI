import { ClipboardList } from 'lucide-react';

export default function TodoEmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <ClipboardList
        aria-hidden="true"
        className="mb-4 text-slate-300"
        size={52}
      />
      <h2 className="text-lg font-semibold text-slate-900">
        No tasks yet
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Add the first item above to start tracking your work.
      </p>
    </div>
  );
}
