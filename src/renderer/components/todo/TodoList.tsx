import TodoEmptyState from './TodoEmptyState';
import TodoItem, { type TodoItemData } from './TodoItem';

type TodoListProps = {
  todos: TodoItemData[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function TodoList({ todos, onToggle, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return <TodoEmptyState />;
  }

  return (
    <ul className="divide-y divide-slate-200">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
