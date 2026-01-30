import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { taskService } from "../services/task.service";
import { LogOut, Plus, MessageSquare, Clock, Trash2 } from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState(null); // ID of expanded task

  // Modal State
  const [isInternalModalOpen, setModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await taskService.getAll(statusFilter || null);
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskService.create({
        title: newTaskTitle,
        description: newTaskDesc,
        status: "todo"
      });
      setModalOpen(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      fetchTasks();
    } catch (error) {
      alert("Error creating task");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await taskService.delete(id);
      fetchTasks();
    } catch (error) {
      alert("Error deleting task (Only Owner/Creator can delete)");
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await taskService.update(task.id, { status: newStatus });
      fetchTasks(); // Refresh to see updates or re-order
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Task Manager</h1>
          <p style={{ color: 'var(--text-muted)' }}>Welcome, {user?.username} ({user?.role})</p>
        </div>
        <button onClick={logout} className="btn" style={{ border: '1px solid #ccc' }}>
          <LogOut size={16} style={{ marginRight: '5px' }} /> Logout
        </button>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <div className="flex gap-2">
          <select
            className="input"
            style={{ width: '150px', marginBottom: 0 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <button className="btn btn-primary flex items-center" onClick={() => setModalOpen(true)}>
          <Plus size={18} style={{ marginRight: '5px' }} /> New Task
        </button>
      </div>

      {/* Task List */}
      {loading ? <p>Loading tasks...</p> : (
        <div className="flex flex-col gap-4">
          {tasks.map(task => (
            <div key={task.id} className="card" style={{ padding: '1rem' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>
                    {task.title}
                    {task.assigned_to_id === user.id && <span style={{ fontSize: '0.7em', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', color: '#0369a1' }}>Assigned to you</span>}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{task.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value)}
                      style={{ padding: '4px', borderRadius: '4px' }}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                    <button
                      className="btn"
                      style={{ color: 'var(--danger)', padding: '4px' }}
                      onClick={() => handleDelete(task.id)}
                      title="Delete Task"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <button
                    className="btn"
                    style={{ fontSize: '0.8rem', color: 'var(--primary)', padding: 0 }}
                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  >
                    {expandedTask === task.id ? 'Hide Details' : 'Show Comments & History'}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedTask === task.id && (
                <TaskDetails taskId={task.id} />
              )}
            </div>
          ))}
          {tasks.length === 0 && <p style={{ textAlign: 'center', color: 'gray' }}>No tasks found.</p>}
        </div>
      )}

      {/* Create Modal */}
      {isInternalModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="card" style={{ width: '400px', marginBottom: 0 }}>
            <h3>Create New Task</h3>
            <form onSubmit={handleCreateTask}>
              <input
                className="input"
                placeholder="Title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
              />
              <textarea
                className="input"
                placeholder="Description"
                rows="3"
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
              />
              <div className="flex justify-between mt-4">
                <button type="button" className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for Details (Comments & History)
function TaskDetails({ taskId }) {
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("comments"); // comments | history

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    const [c, h] = await Promise.all([
      taskService.getComments(taskId),
      taskService.getHistory(taskId)
    ]);
    setComments(c);
    setHistory(h);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await taskService.addComment(taskId, newComment);
    setNewComment("");
    loadData(); // Refresh both (comment adds history)
  };

  return (
    <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
      <div className="flex gap-4" style={{ marginBottom: '1rem', borderBottom: '1px solid #eee' }}>
        <button
          className="btn"
          style={{ borderBottom: activeTab === 'comments' ? '2px solid var(--primary)' : 'none', borderRadius: 0 }}
          onClick={() => setActiveTab('comments')}
        >
          Comments ({comments.length})
        </button>
        <button
          className="btn"
          style={{ borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : 'none', borderRadius: 0 }}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {activeTab === 'comments' && (
        <div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
            {comments.map(c => (
              <div key={c.id} style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{c.content}</p>
                <span style={{ fontSize: '0.7em', color: '#9ca3af' }}>{new Date(c.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              className="input"
              style={{ marginBottom: 0 }}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Send</button>
          </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {history.map(h => (
            <div key={h.id} style={{ fontSize: '0.85rem', marginBottom: '0.5rem', borderLeft: '2px solid #ddd', paddingLeft: '0.5rem' }}>
              <strong>{h.action}</strong>: {h.details}
              <div style={{ color: '#9ca3af', fontSize: '0.75em' }}>{new Date(h.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
