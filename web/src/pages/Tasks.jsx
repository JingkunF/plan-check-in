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

function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 10,
    category: ''
  });
  const [checkinNotes, setCheckinNotes] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('获取任务失败:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/tasks', formData);
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
      await axios.post('/checkin', {
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

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      try {
        await axios.delete(`/tasks/${taskId}`);
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
          <div key={task.id} className="card hover:shadow-cute transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
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
                    <span className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full text-xs text-purple-700">
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
              {task.created_by === user.id && (
                <div className="flex space-x-2">
                  <button className="text-purple-400 hover:text-purple-600 transition-colors">
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