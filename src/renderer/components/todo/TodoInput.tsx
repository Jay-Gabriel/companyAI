import { FormEvent, useState } from 'react';
import { Plus } from 'lucide-react';

type TodoInputProps = {
  onAdd: (title: string) => void;
};

export default function TodoInput({ onAdd }: TodoInputProps) {
  const [draft, setDraft] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;

    onAdd(title);
    setDraft('');
  };

  return (
    <form
      className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="todo-title">
        New task
      </label>
      <input
        id="todo-title"
        className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 text-base outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Add a new task"
        value={draft}
      />
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={!draft.trim()}
        type="submit"
      >
        <Plus aria-hidden="true" size={18} />
        Add task
      </button>
    </form>
  );
}
