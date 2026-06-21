const TodoModel = require('../models/todo');

const todoController = {
  getAllTodos(req, res) {
    const todos = TodoModel.findAll();
    res.json({ success: true, data: todos });
  },

  getTodoById(req, res) {
    const todo = TodoModel.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }
    res.json({ success: true, data: todo });
  },

  createTodo(req, res) {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    const todo = TodoModel.create({ title, description });
    res.status(201).json({ success: true, data: todo });
  },

  updateTodo(req, res) {
    const { title, description, completed } = req.body;
    const todo = TodoModel.update(req.params.id, { title, description, completed });
    if (!todo) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }
    res.json({ success: true, data: todo });
  },

  deleteTodo(req, res) {
    const deleted = TodoModel.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }
    res.json({ success: true, message: 'Todo deleted' });
  }
};

module.exports = todoController;
