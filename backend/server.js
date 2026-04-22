require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connectDB = require('./db');

const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

const app = express();
app.use(cors({
  origin: "https://project-task-scheduller.vercel.app"
}));
app.use(express.json());

// Connect Database
connectDB();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-internship';

// Middleware to authenticate
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
};

// --- AUTH ROUTES ---
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });

    if (!/^\d{8}$/.test(password)) {
        return res.status(400).json({ message: 'Password must be exactly 8 digits long' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ message: 'User created successfully', token, user: { id: newUser._id, name, email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: 'Logged in successfully', token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        // Map _id to id for frontend compatibility
        res.json({ id: user._id, name: user.name, email: user.email });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- PROJECT ROUTES ---
app.get('/api/projects', authenticate, async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(projects.map(p => {
            const projObj = p.toObject();
            projObj.id = projObj._id;
            return projObj;
        }));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/projects', authenticate, async (req, res) => {
    try {
        const { name, description, color } = req.body;
        const newProject = new Project({ userId: req.userId, name, description, color });
        await newProject.save();
        const projObj = newProject.toObject();
        projObj.id = projObj._id;
        res.status(201).json(projObj);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        // Also delete tasks in this project
        await Task.deleteMany({ projectId: req.params.id });
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- TASK ROUTES ---
app.get('/api/tasks', authenticate, async (req, res) => {
    try {
        const { projectId } = req.query;
        const filter = { userId: req.userId };
        if (projectId) filter.projectId = projectId;
        
        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        // Map _id to id to not break frontend
        res.json(tasks.map(t => {
            const taskObj = t.toObject();
            taskObj.id = taskObj._id;
            return taskObj;
        }));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/tasks', authenticate, async (req, res) => {
    try {
        const { title, description, status, priority, dueDate, projectId } = req.body;
        const newTask = new Task({
            userId: req.userId,
            title,
            description,
            status: status || 'Todo',
            priority: priority || 'Medium',
            dueDate,
            projectId,
            completed: false
        });
        await newTask.save();
        const taskObj = newTask.toObject();
        taskObj.id = taskObj._id;
        res.status(201).json(taskObj);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/tasks/:id', authenticate, async (req, res) => {
    try {
        const updates = req.body;
        // If frontend passes completed boolean, update status accordingly or keep simple
        if (updates.completed !== undefined && !updates.status) {
            updates.status = updates.completed ? 'Done' : 'Todo';
        }
        if (updates.status === 'Done') updates.completed = true;
        else if (updates.status) updates.completed = false;

        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $set: updates },
            { new: true }
        );
        if (!task) return res.status(404).json({ message: 'Task not found' });
        
        const taskObj = task.toObject();
        taskObj.id = taskObj._id;
        res.json(taskObj);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/tasks/:id', authenticate, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
