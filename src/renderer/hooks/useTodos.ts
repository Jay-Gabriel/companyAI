import { useEffect, useMemo, useState } from 'react';
import { type Todo } from '../lib/todoApi';
import * as api from '../lib/todoApi';

const STORAGE_KEY = 'todo-list-items';

const seedTodos: Todo[] = [
  { id: 'seed-1', title: 'Review API endpoint design', completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'seed-2', title: 'Ship the todo list UI', completed: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

type ConnectionStatus = 'connecting' | 'online' | 'offline';

function createLocal(title: string): Todo {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function loadLocal(): Todo[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return seedTodos;
  try {
    return JSON.parse(saved) as Todo[];
  } catch {
    return seedTodos;
  }
}

function saveLocal(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadLocal);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  const completedCount = useMemo(
    () => todos.filter((t) => t.completed).length,
    [todos],
  );
  const remainingCount = todos.length - completedCount;

  useEffect(() => {
    saveLocal(todos);
  }, [todos]);

  useEffect(() => {
    let cancelled = false;

    api.getTodos()
      .then((remote) => {
        if (cancelled) return;
        setTodos(remote);
        setStatus('online');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('offline');
      });

    return () => { cancelled = true; };
  }, []);

  const addTodo = async (title: string) => {
    const optimistic = createLocal(title);
    setTodos((prev) => [optimistic, ...prev]);

    if (status === 'online') {
      try {
        const created = await api.createTodo(title);
        setTodos((prev) => prev.map((t) => (t.id === optimistic.id ? created : t)));
      } catch {
        setStatus('offline');
      }
    }
  };

  const toggleTodo = async (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );

    if (status === 'online') {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;
      try {
        await api.updateTodo(id, { completed: !todo.completed });
      } catch {
        setStatus('offline');
      }
    }
  };

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));

    if (status === 'online') {
      try {
        await api.deleteTodo(id);
      } catch {
        setStatus('offline');
      }
    }
  };

  return {
    todos,
    status,
    completedCount,
    remainingCount,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
