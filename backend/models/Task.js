const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Optional
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['Todo', 'In Progress', 'Done'], default: 'Todo' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false }, // For backward compatibility with simple views
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
