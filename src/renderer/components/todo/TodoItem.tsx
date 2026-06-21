import { Check, Circle, Trash2 } from 'lucide-react';

export type TodoItemData = {
  id: string;
  title: string;
  completed: boolean;
};

type TodoItemProps = {
  todo: TodoItemData;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
      <button
        aria-label={
          todo.completed
            ? `Mark ${todo.title} as incomplete`
            : `Mark ${todo.title} as complete`
        }
        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
          todo.completed
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-slate-300 bg-white text-slate-400 hover:border-emerald-500 hover:text-emerald-600'
        }`}
        onClick={() => onToggle(todo.id)}
        type="button"
      >
        {todo.completed ? (
          <Check aria-hidden="true" size={18} />
        ) : (
          <Circle aria-hidden="true" size={18} />
        )}
      </button>

      <span
        className={`min-w-0 break-words text-sm leading-6 sm:text-base ${
          todo.completed
            ? 'text-slate-400 line-through'
            : 'text-slate-900'
        }`}
      >
        {todo.title}
      </span>

      <button
        aria-label={`Delete ${todo.title}`}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
        onClick={() => onDelete(todo.id)}
        type="button"
      >
        <Trash2 aria-hidden="true" size={18} />
      </button>
    </li>
  );
}
