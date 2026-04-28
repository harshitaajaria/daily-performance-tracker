import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import './index.css';

const API_URL = '/api';

function AppContent() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tasks, setTasks] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [goals, setGoals] = useState([]);
  const [goalProgress, setGoalProgress] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const handleSwitchAuth = (e) => setAuthView(e.detail);
    window.addEventListener('switchAuth', handleSwitchAuth);
    return () => window.removeEventListener('switchAuth', handleSwitchAuth);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
      fetchDashboardStats();
      fetchGoals();
    }
  }, [selectedDate, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && (activeTab === 'analysis' || activeTab === 'reports')) {
      fetchWeeklyStats();
    }
  }, [activeTab, isAuthenticated]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks/date/${selectedDate}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks/stats/dashboard?date=${selectedDate}`);
      setDashboardStats(response.data);
      generateSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchWeeklyStats = async () => {
    try {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const response = await axios.get(`${API_URL}/tasks/stats/weekly?startDate=${weekStart}`);
      setWeeklyStats(response.data);
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  };

  const fetchGoals = async () => {
    try {
      const [goalsRes, progressRes] = await Promise.all([
        axios.get(`${API_URL}/goals`),
        axios.get(`${API_URL}/goals/progress?date=${selectedDate}`)
      ]);
      setGoals(goalsRes.data);
      setGoalProgress(progressRes.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const generateSuggestions = (stats) => {
    const newSuggestions = [];
    
    if (stats.statusCount?.Missed > 2) {
      newSuggestions.push('Consider reducing your daily workload - you have multiple missed tasks.');
    }
    
    if (stats.totalTasks > 10) {
      newSuggestions.push('You have many tasks today. Consider prioritizing the most important ones.');
    }
    
    const avgEffort = stats.totalTime > 0 
      ? Object.values(stats.categoryScores || {}).reduce((a, b) => a + b, 0) / stats.totalTime 
      : 0;
    
    if (avgEffort < 2.5) {
      newSuggestions.push('Your effort levels seem low. Try to focus more on quality over quantity.');
    }
    
    setSuggestions(newSuggestions);
  };

  const handleSaveTask = async (taskData) => {
    setLoadingData(true);
    try {
      if (editingTask) {
        await axios.put(`${API_URL}/tasks/${editingTask._id}`, taskData);
      } else {
        await axios.post(`${API_URL}/tasks`, { ...taskData, date: selectedDate });
      }
      fetchTasks();
      fetchDashboardStats();
      setShowModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
    setLoadingData(false);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await axios.delete(`${API_URL}/tasks/${id}`);
      fetchTasks();
      fetchDashboardStats();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleSaveGoal = async (goalData) => {
    setLoadingData(true);
    try {
      await axios.post(`${API_URL}/goals`, goalData);
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
    setLoadingData(false);
  };

  const openAddModal = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-wrapper">
        {authView === 'login' ? <Login /> : <Register />}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>📊 Daily Performance Tracker</h1>
            <p>Track your productivity and achieve your goals</p>
          </div>
          <div className="user-info">
            <span>Welcome, {user?.name}</span>
            <button onClick={logout} className="btn-logout">Logout</button>
          </div>
        </div>
        <nav className="nav">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={activeTab === 'tasks' ? 'active' : ''} 
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button 
            className={activeTab === 'analysis' ? 'active' : ''} 
            onClick={() => setActiveTab('analysis')}
          >
            Analysis
          </button>
          <button 
            className={activeTab === 'reports' ? 'active' : ''} 
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
          <button 
            className={activeTab === 'goals' ? 'active' : ''} 
            onClick={() => setActiveTab('goals')}
          >
            Goals
          </button>
        </nav>
      </header>

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardView 
            stats={dashboardStats}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            suggestions={suggestions}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView 
            tasks={tasks}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={handleDeleteTask}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisView 
            weeklyStats={weeklyStats}
            tasks={tasks}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView 
            weeklyStats={weeklyStats}
            tasks={tasks}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsView 
            goals={goals}
            progress={goalProgress}
            onSave={handleSaveGoal}
          />
        )}
      </main>

      {showModal && (
        <TaskModal 
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
          loading={loadingData}
        />
      )}
    </div>
  );
}

function DashboardView({ stats, selectedDate, onDateChange, suggestions }) {
  return (
    <div>
      <div className="date-picker">
        <label>Select Date: </label>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Time</h3>
            <p className="stat-value">{stats.totalTime || 0} min</p>
          </div>
          <div className="stat-card">
            <h3>Productivity Score</h3>
            <p className="stat-value">{stats.totalScore || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Tasks</h3>
            <p className="stat-value">{stats.totalTasks || 0}</p>
          </div>
        </div>
      )}

      {stats?.categoryDistribution && (
        <div className="category-distribution">
          <h3>Time by Category</h3>
          <div className="category-bars">
            {Object.entries(stats.categoryDistribution).map(([category, time]) => (
              <div key={category} className="category-bar">
                <span className="category-label">{category}</span>
                <div className="bar-container">
                  <div 
                    className={`bar ${category.toLowerCase()}`} 
                    style={{ width: `${Math.min((time / (stats.totalTime || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="category-time">{time} min</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.statusCount && (
        <div className="status-summary">
          <h3>Task Status</h3>
          <div className="status-cards">
            <div className="status-card completed">
              <span className="status-count">{stats.statusCount.Completed || 0}</span>
              <span className="status-label">Completed</span>
            </div>
            <div className="status-card partial">
              <span className="status-count">{stats.statusCount.Partial || 0}</span>
              <span className="status-label">Partial</span>
            </div>
            <div className="status-card missed">
              <span className="status-count">{stats.statusCount.Missed || 0}</span>
              <span className="status-label">Missed</span>
            </div>
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="suggestions">
          <h3>💡 Smart Suggestions</h3>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TasksView({ tasks, selectedDate, onDateChange, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div className="date-picker">
        <label>Select Date: </label>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => onDateChange(e.target.value)}
        />
        <button className="btn-primary" onClick={onAdd}>+ Add Task</button>
      </div>

      <div className="tasks-list">
        {tasks.length === 0 ? (
          <p className="no-tasks">No tasks for this date. Add your first task!</p>
        ) : (
          tasks.map(task => (
            <div key={task._id} className={`task-card ${task.status.toLowerCase()}`}>
              <div className="task-header">
                <h3>{task.taskName}</h3>
                <span className={`task-status ${task.status.toLowerCase()}`}>{task.status}</span>
              </div>
              <div className="task-details">
                <span className="task-category">{task.category}</span>
                <span className="task-time">{task.timeSpent} min</span>
                <span className="task-effort">Effort: {task.effortLevel}/5</span>
              </div>
              {task.notes && <p className="task-notes">{task.notes}</p>}
              <div className="task-actions">
                <button onClick={() => onEdit(task)}>Edit</button>
                <button onClick={() => onDelete(task._id)} className="btn-delete">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AnalysisView({ weeklyStats, tasks }) {
  return (
    <div>
      <h2>📈 Weekly Analysis</h2>
      {weeklyStats ? (
        <div className="analysis-content">
          <div className="analysis-card">
            <h3>Best Day</h3>
            <p>{weeklyStats.bestDay?.date || 'N/A'}</p>
            <p className="analysis-value">{weeklyStats.bestDay?.score || 0} points</p>
          </div>
          <div className="analysis-card">
            <h3>Worst Day</h3>
            <p>{weeklyStats.worstDay?.date || 'N/A'}</p>
            <p className="analysis-value">{weeklyStats.worstDay?.score || 0} points</p>
          </div>
          <div className="analysis-card">
            <h3>Most Consistent</h3>
            <p>{weeklyStats.mostConsistentCategory || 'N/A'}</p>
          </div>
          <div className="analysis-card">
            <h3>Missed Tasks</h3>
            <p className="analysis-value">{weeklyStats.missedTasksCount || 0}</p>
          </div>
          <div className="analysis-card">
            <h3>Low Effort Tasks</h3>
            <p className="analysis-value">{weeklyStats.lowEffortTasksCount || 0}</p>
          </div>
        </div>
      ) : (
        <p>No analysis data available yet.</p>
      )}
    </div>
  );
}

function ReportsView({ weeklyStats, tasks, selectedDate }) {
  return (
    <div>
      <h2>📋 Reports</h2>
      
      <div className="report-section">
        <h3>Daily Report - {selectedDate}</h3>
        <div className="report-card">
          <p>Tasks Completed: {tasks.filter(t => t.status === 'Completed').length}</p>
          <p>Total Time: {tasks.reduce((sum, t) => sum + t.timeSpent, 0)} min</p>
          <p>Total Score: {tasks.reduce((sum, t) => sum + (t.timeSpent * t.effortLevel), 0)}</p>
        </div>
      </div>

      <div className="report-section">
        <h3>Weekly Summary</h3>
        {weeklyStats ? (
          <div className="report-card">
            <p><strong>Best Day:</strong> {weeklyStats.bestDay?.date || 'N/A'} ({weeklyStats.bestDay?.score || 0} pts)</p>
            <p><strong>Worst Day:</strong> {weeklyStats.worstDay?.date || 'N/A'} ({weeklyStats.worstDay?.score || 0} pts)</p>
            <p><strong>Most Consistent Category:</strong> {weeklyStats.mostConsistentCategory || 'N/A'}</p>
            <p><strong>Total Time:</strong> {weeklyStats.totalTime || 0} min</p>
            <p><strong>Total Score:</strong> {weeklyStats.totalScore || 0}</p>
          </div>
        ) : (
          <p>No weekly data available.</p>
        )}
      </div>
    </div>
  );
}

function GoalsView({ goals, progress, onSave }) {
  const [category, setCategory] = useState('Work');
  const [targetTime, setTargetTime] = useState(60);
  const [frequency, setFrequency] = useState('Daily');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ category, targetTime, frequency });
  };

  return (
    <div>
      <h2>🎯 Goal Setting</h2>
      
      <form onSubmit={handleSubmit} className="goal-form">
        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Work">Work</option>
              <option value="Health">Health</option>
              <option value="Learning">Learning</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
          <div className="form-group">
            <label>Target Time (minutes)</label>
            <input 
              type="number" 
              value={targetTime} 
              onChange={(e) => setTargetTime(Number(e.target.value))}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Frequency</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">Set Goal</button>
        </div>
      </form>

      <div className="goals-list">
        <h3>Your Goals</h3>
        {goals.length === 0 ? (
          <p>No goals set yet.</p>
        ) : (
          goals.map(goal => (
            <div key={goal._id} className="goal-card">
              <span className="goal-category">{goal.category}</span>
              <span className="goal-target">{goal.targetTime} min ({goal.frequency})</span>
            </div>
          ))
        )}
      </div>

      {progress.length > 0 && (
        <div className="goal-progress">
          <h3>Today's Progress</h3>
          {progress.map(p => (
            <div key={p.category} className="progress-item">
              <span>{p.category}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min(p.percentage, 100)}%` }}
                ></div>
              </div>
              <span>{p.actual}/{p.target} min ({p.percentage}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskModal({ task, onSave, onClose, loading }) {
  const [taskName, setTaskName] = useState(task?.taskName || '');
  const [category, setCategory] = useState(task?.category || 'Work');
  const [timeSpent, setTimeSpent] = useState(task?.timeSpent || 30);
  const [effortLevel, setEffortLevel] = useState(task?.effortLevel || 3);
  const [status, setStatus] = useState(task?.status || 'Partial');
  const [notes, setNotes] = useState(task?.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ taskName, category, timeSpent, effortLevel, status, notes });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{task ? 'Edit Task' : 'Add New Task'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Name</label>
            <input 
              type="text" 
              value={taskName} 
              onChange={(e) => setTaskName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Work">Work</option>
              <option value="Health">Health</option>
              <option value="Learning">Learning</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Time Spent (minutes)</label>
            <input 
              type="number" 
              value={timeSpent} 
              onChange={(e) => setTimeSpent(Number(e.target.value))}
              min="0"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Effort Level (1-5)</label>
            <input 
              type="number" 
              value={effortLevel} 
              onChange={(e) => setEffortLevel(Number(e.target.value))}
              min="1"
              max="5"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Completed">Completed</option>
              <option value="Partial">Partial</option>
              <option value="Missed">Missed</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Notes</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;