import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Plus, CheckCircle, Circle, Trash2, Folder, LayoutDashboard, Calendar, X } from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    
    // Modals
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTaskForm, setNewTaskForm] = useState({ title: '', description: '', priority: 'Medium' });

    useEffect(() => {
        fetchProjects();
        fetchTasks();
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [selectedProject]);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(res.data);
        } catch (error) {
            console.error("Failed to fetch projects");
        }
    };

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = `${import.meta.env.VITE_API_URL}/api/tasks`;
            if (selectedProject) {
                url += `?projectId=${selectedProject.id}`;
            }
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(res.data);
        } catch (error) {
            console.error("Failed to fetch tasks");
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/projects`, { name: newProjectName }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects([res.data, ...projects]);
            setNewProjectName('');
            setShowProjectModal(false);
            setSelectedProject(res.data);
        } catch (error) {
            console.error("Failed to add project");
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskForm.title.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const payload = { ...newTaskForm };
            if (selectedProject) payload.projectId = selectedProject.id;
            
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/tasks`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks([res.data, ...tasks]);
            setNewTaskForm({ title: '', description: '', priority: 'Medium' });
            setShowTaskModal(false);
        } catch (error) {
            console.error("Failed to add task");
        }
    };

    const toggleTaskStatus = async (task) => {
        try {
            const token = localStorage.getItem('token');
            const newStatus = task.status === 'Done' ? 'Todo' : 'Done';
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/tasks/${task.id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(tasks.map(t => t.id === task.id ? res.data : t));
        } catch (error) {
            console.error("Failed to update task");
        }
    };

    const deleteTask = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/tasks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(tasks.filter(t => t.id !== id));
        } catch (error) {
            console.error("Failed to delete task");
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>Workspace</h2>
                </div>
                <nav className="sidebar-nav">
                    <button 
                        className={`nav-item ${!selectedProject ? 'active' : ''}`}
                        onClick={() => setSelectedProject(null)}
                    >
                        <LayoutDashboard size={18} />
                        All Tasks
                    </button>
                    
                    <div className="nav-section">
                        <div className="section-header">
                            <span>Projects</span>
                            <button onClick={() => setShowProjectModal(true)} className="icon-btn">
                                <Plus size={16} />
                            </button>
                        </div>
                        {projects.map(proj => (
                            <button 
                                key={proj.id} 
                                className={`nav-item ${selectedProject?.id === proj.id ? 'active' : ''}`}
                                onClick={() => setSelectedProject(proj)}
                            >
                                <Folder size={18} color={proj.color || '#818cf8'} />
                                {proj.name}
                            </button>
                        ))}
                    </div>
                </nav>
                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
                        <span className="user-name">{user.name}</span>
                    </div>
                    <button onClick={logout} className="icon-btn logout"><LogOut size={18} /></button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="content-header">
                    <div>
                        <h1>{selectedProject ? selectedProject.name : 'All Tasks'}</h1>
                        <p className="subtitle">{tasks.length} tasks in this view</p>
                    </div>
                    <button className="primary-btn" onClick={() => setShowTaskModal(true)}>
                        <Plus size={18} /> New Task
                    </button>
                </header>

                <div className="tasks-board">
                    {tasks.length === 0 ? (
                        <div className="empty-state">
                            <Calendar size={48} className="empty-icon" />
                            <h3>No tasks yet</h3>
                            <p>Get started by creating a new task.</p>
                            <button className="primary-btn mt-4" onClick={() => setShowTaskModal(true)}>
                                Create Task
                            </button>
                        </div>
                    ) : (
                        <div className="task-list">
                            {tasks.map(task => (
                                <div key={task.id} className={`task-card ${task.status === 'Done' ? 'done' : ''}`}>
                                    <button className="status-toggle" onClick={() => toggleTaskStatus(task)}>
                                        {task.status === 'Done' ? <CheckCircle className="text-success" /> : <Circle />}
                                    </button>
                                    <div className="task-details">
                                        <h4>{task.title}</h4>
                                        {task.description && <p>{task.description}</p>}
                                        <div className="task-meta">
                                            <span className={`badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                                            {task.projectId && !selectedProject && (
                                                <span className="badge project">Project Task</span>
                                            )}
                                        </div>
                                    </div>
                                    <button className="icon-btn delete-btn" onClick={() => deleteTask(task.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            {showProjectModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Create Project</h3>
                            <button onClick={() => setShowProjectModal(false)} className="icon-btn"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateProject}>
                            <div className="form-group">
                                <label>Project Name</label>
                                <input 
                                    type="text" 
                                    value={newProjectName} 
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="e.g. Website Redesign"
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowProjectModal(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTaskModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Create Task {selectedProject ? `in ${selectedProject.name}` : ''}</h3>
                            <button onClick={() => setShowTaskModal(false)} className="icon-btn"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleAddTask}>
                            <div className="form-group">
                                <label>Task Title</label>
                                <input 
                                    type="text" 
                                    value={newTaskForm.title} 
                                    onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
                                    placeholder="What needs to be done?"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea 
                                    value={newTaskForm.description} 
                                    onChange={(e) => setNewTaskForm({...newTaskForm, description: e.target.value})}
                                    placeholder="Add more details..."
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select 
                                    value={newTaskForm.priority}
                                    onChange={(e) => setNewTaskForm({...newTaskForm, priority: e.target.value})}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="secondary-btn" onClick={() => setShowTaskModal(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">Add Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
