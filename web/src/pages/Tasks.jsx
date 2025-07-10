import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  Plus, 
  CheckSquare, 
  Clock, 
  Star,
  Edit,
  Trash2,
  User,
  Sparkles,
  Heart
} from 'lucide-react';

// 颜色池 - 10种独特的颜色
const colorPalette = [
  { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500', hex: '#3B82F6' },
  { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500', hex: '#10B981' },
  { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-500', hex: '#F59E0B' },
  { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500', hex: '#8B5CF6' },
  { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-500', hex: '#EC4899' },
  { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-500', hex: '#6366F1' },
  { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-500', hex: '#059669' },
  { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500', hex: '#F97316' },
  { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500', hex: '#EF4444' },
  { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-500', hex: '#64748B' }
];

function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 10,
    category: ''
  });
  const [checkinNotes, setCheckinNotes] = useState('');
  
  // 为分类分配颜色 - 使用简单的哈希算法
  const getCategoryColor = (category) => {
    if (!category) return colorPalette[9]; // 默认使用最后一个颜色
    
    // 简单的字符串哈希算法
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      const char = category.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    // 使用哈希值选择颜色
    const colorIndex = Math.abs(hash) % colorPalette.length;
    return colorPalette[colorIndex];
  };

  // 获取分类的CSS类名（用于色块显示）
  function getCategoryColorClass(category) {
    const color = getCategoryColor(category);
    return `${color.bg} ${color.text}`;
  }

  // 获取分类的背景色（用于左侧色条）
  function getCategoryBgColor(category) {
    const color = getCategoryColor(category);
    return color.hex;
  }

  // 获取分类的边框颜色（用于任务卡片边框）
  function getCategoryBorderColor(category) {
    const color = getCategoryColor(category);
    return color.border;
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('获取任务失败:', error);
      setTasks([]); // 保证 tasks 始终为数组
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/tasks', formData);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        points: 10,
        category: ''
      });
      fetchTasks();
    } catch (error) {
      console.error('创建任务失败:', error);
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/checkin', {
        task_id: selectedTask.id,
        notes: checkinNotes
      });
      setShowCheckinModal(false);
      setSelectedTask(null);
      setCheckinNotes('');
      fetchTasks();
    } catch (error) {
      console.error('打卡失败:', error);
    }
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      points: task.points,
      category: task.category || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/tasks/${selectedTask.id}`, formData);
      setShowEditModal(false);
      setSelectedTask(null);
      setFormData({
        title: '',
        description: '',
        points: 10,
        category: ''
      });
      fetchTasks();
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        fetchTasks();
      } catch (error) {
        console.error('删除任务失败:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 分类色块栏 */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-2">
          {[...new Set(tasks.map(t => t.category).filter(Boolean))].map(cat => (
            <span
              key={cat}
              className="px-3 py-1 rounded-full text-white text-sm font-medium shadow"
              style={{ background: getCategoryBgColor(cat) }}
            >
              {cat}
            </span>
          ))}
        </div>
      )}
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-pink-700 mb-2 flex items-center">
            <Sparkles className="h-8 w-8 mr-3 text-pink-500" />
            任务管理
          </h1>
          <p className="text-pink-600 text-lg">
            创建和管理你的任务，完成打卡获得积分
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center text-lg px-6 py-3"
        >
          <Plus className="h-5 w-5 mr-2" />
          创建任务
        </button>
      </div>

      {/* 任务列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="card hover:shadow-cute transition-all duration-300 transform hover:-translate-y-1 relative"
          >
            {/* 左侧色条 */}
            {task.category && (
              <div
                className="absolute left-0 top-0 h-full w-2 rounded-l"
                style={{ background: getCategoryBgColor(task.category) }}
              ></div>
            )}
            <div className="flex items-start justify-between mb-4 pl-3">
              <div className="flex-1">
                <h3 className="font-semibold text-pink-800 text-lg mb-2">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-pink-600 mb-3 leading-relaxed">{task.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-pink-500 mb-3">
                  <div className="flex items-center bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 mr-1 text-orange-500" />
                    {task.points} 积分
                  </div>
                  {task.category && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold shadow"
                      style={{ background: getCategoryBgColor(task.category), color: '#fff' }}
                    >
                      {task.category}
                    </span>
                  )}
                </div>
                {task.created_by_name && (
                  <div className="flex items-center mt-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    <User className="h-4 w-4 mr-1" />
                    创建者: {task.created_by_name}
                  </div>
                )}
              </div>
              {user && String(task.created_by) === String(user.id) && (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditTask(task)}
                    className="text-purple-400 hover:text-purple-600 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-pink-100">
              <div className="text-xs text-pink-500">
                {new Date(task.created_at).toLocaleDateString()}
              </div>
              <button
                onClick={() => {
                  setSelectedTask(task);
                  setShowCheckinModal(true);
                }}
                className="btn-success flex items-center text-sm"
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                打卡
              </button>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <CheckSquare className="h-12 w-12 text-pink-500" />
          </div>
          <h3 className="text-xl font-medium text-pink-700 mb-3">暂无任务</h3>
          <p className="text-pink-600 text-lg">
            创建一个新任务开始吧！
          </p>
        </div>
      )}

      {/* 创建任务模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-8">
            <div className="flex items-center mb-6">
              <Heart className="h-6 w-6 text-pink-500 mr-3" />
              <h2 className="text-2xl font-bold text-pink-700">创建任务</h2>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label className="label">任务标题</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="输入任务标题..."
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">任务描述</label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="描述一下这个任务..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">积分</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={formData.points}
                    onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="label">分类</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="如：学习、运动"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary flex-1">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑任务模态框 */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-8">
            <div className="flex items-center mb-6">
              <Edit className="h-6 w-6 text-purple-500 mr-3" />
              <h2 className="text-2xl font-bold text-purple-700">编辑任务</h2>
            </div>
            <form onSubmit={handleUpdateTask} className="space-y-5">
              <div>
                <label className="label">任务标题</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="输入任务标题..."
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">任务描述</label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="描述一下这个任务..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">积分</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={formData.points}
                    onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="label">分类</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="如：学习、运动"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary flex-1">
                  更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 打卡模态框 */}
      {showCheckinModal && selectedTask && (
        <div className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-8">
            <div className="flex items-center mb-6">
              <CheckSquare className="h-6 w-6 text-green-500 mr-3" />
              <h2 className="text-2xl font-bold text-green-700">任务打卡</h2>
            </div>
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-mint-50 rounded-2xl border border-green-100">
              <h3 className="font-semibold text-green-800 text-lg mb-2">{selectedTask.title}</h3>
              <p className="text-sm text-green-600 mb-3">{selectedTask.description}</p>
              <div className="flex items-center text-sm text-green-600">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                {selectedTask.points} 积分
              </div>
            </div>
            
            <form onSubmit={handleCheckin} className="space-y-5">
              <div>
                <label className="label">打卡备注（可选）</label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="描述一下完成情况..."
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="btn-success flex-1">
                  确认打卡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks; 