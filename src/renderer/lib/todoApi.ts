export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

const BASE_URL = '/api/todos';

class TodoApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'TodoApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json();

  if (!res.ok) {
    const err = body?.error;
    throw new TodoApiError(
      res.status,
      err?.code ?? 'UNKNOWN_ERROR',
      err?.message ?? 'An unexpected error occurred.',
    );
  }

  return body.data ?? body;
}

export function getTodos(): Promise<Todo[]> {
  return request<Todo[]>(BASE_URL);
}

export function createTodo(title: string): Promise<Todo> {
  return request<Todo>(BASE_URL, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export function updateTodo(id: string, fields: Partial<Pick<Todo, 'title' | 'completed'>>): Promise<Todo> {
  return request<Todo>(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  });
}

export function deleteTodo(id: string): Promise<void> {
  return request<void>(`${BASE_URL}/${id}`, { method: 'DELETE' });
}
