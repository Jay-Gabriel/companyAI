const { v4: uuidv4 } = require('uuid');

class Todo {
  constructor(title, description = '') {
    this.id = uuidv4();
    this.title = title;
    this.description = description;
    this.completed = false;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }
}

const todos = [];

const TodoModel = {
  findAll() {
    return [...todos];
  },

  findById(id) {
    return todos.find(t => t.id === id);
  },

  create(data) {
    const todo = new Todo(data.title, data.description);
    todos.push(todo);
    return todo;
  },

  update(id, data) {
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) return null;
    todos[index] = { ...todos[index], ...data, updatedAt: new Date().toISOString() };
    return todos[index];
  },

  delete(id) {
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) return false;
    todos.splice(index, 1);
    return true;
  }
};

module.exports = TodoModel;
