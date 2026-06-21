import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, Circle, ClipboardList, Plus, Trash2 } from 'lucide-react';

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

const STORAGE_KEY = 'todo-list-items';

const initialTodos: Todo[] = [
  {
    id: 'seed-1',
    title: 'Review API endpoint design',
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    title: 'Ship the todo list UI',
    completed: true,
    createdAt: new Date().toISOString(),
  },
];

function createTodo(title: string): Todo {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

export default function TodoListApp() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Todo[]) : initialTodos;
  });
  const [draft, setDraft] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos]
  );
  const remainingCount = todos.length - completedCount;

  const addTodo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;

    setTodos((current) => [createTodo(title), ...current]);
    setDraft('');
  };

  const toggleTodo = (id: string) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  };

  return (
    <main className="min-h-screen bg-stone-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ClipboardList aria-hidden="true" size={24} />
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              Todo List
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Capture tasks, mark progress, and remove work that is no longer
              needed.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-2 text-center sm:w-72">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <dt className="text-xs font-medium uppercase tracking-normal text-slate-500">
                Total
              </dt>
              <dd className="text-xl font-semibold">{todos.length}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <dt className="text-xs font-medium uppercase tracking-normal text-slate-500">
                Open
              </dt>
              <dd className="text-xl font-semibold">{remainingCount}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <dt className="text-xs font-medium uppercase tracking-normal text-slate-500">
                Done
              </dt>
              <dd className="text-xl font-semibold">{completedCount}</dd>
            </div>
          </dl>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <form
            className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row"
            onSubmit={addTodo}
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

          {todos.length === 0 ? (
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
          ) : (
            <ul className="divide-y divide-slate-200">
              {todos.map((todo) => (
                <li
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3"
                  key={todo.id}
                >
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
                    onClick={() => toggleTodo(todo.id)}
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
                    onClick={() => deleteTodo(todo.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
