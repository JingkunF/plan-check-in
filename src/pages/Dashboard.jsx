import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  CheckSquare, 
  Gift, 
  TrendingUp, 
  Calendar,
  Plus,
  Star,
  Sparkles,
  Heart,
  Edit,
  Trash2,
  User,
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 任务管理状态
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    points: 10,
    category: ''
  });
  const [checkinNotes, setCheckinNotes] = useState('');

  // 奖励管理状态
  const [showCreateRewardModal, setShowCreateRewardModal] = useState(false);
  const [showEditRewardModal, setShowEditRewardModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [rewardFormData, setRewardFormData] = useState({
    title: '',
    description: '',
    points_required: 50
  });



  useEffect(() => {
    fetchDashboardData();
    fetchPointsBalance();
  }, []);

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const [statsRes, tasksRes, rewardsRes, pointsRes, checkinsRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/tasks'),
        axios.get('/api/rewards'),
        axios.get('/api/points'),
        axios.get('/api/checkins')
      ]);

      setStats(statsRes.data);
      setTasks(tasksRes.data);
      setRewards(rewardsRes.data);
      setPointsHistory(pointsRes.data);
      setCheckins(checkinsRes.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPointsBalance = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get('/api/points/balance');
      setPointsBalance(response.data.balance);
    } catch (error) {
      console.error('获取积分余额失败:', error);
    }
  };

  // 任务管理函数
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('请先登录后再创建任务');
      return;
    }
    
    try {
      await axios.post('/api/tasks', taskFormData);
      setShowCreateTaskModal(false);
      setTaskFormData({
        title: '',
        description: '',
        points: 10,
        category: ''
      });
      fetchDashboardData();
    } catch (error) {
      console.error('创建任务失败:', error);
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('请先登录后再进行打卡');
      return;
    }
    
    try {
      await axios.post('/api/checkin', {
        task_id: selectedTask.id,
        notes: checkinNotes
      });
      setShowCheckinModal(false);
      setSelectedTask(null);
      setCheckinNotes('');
      fetchDashboardData();
      fetchPointsBalance();
    } catch (error) {
      console.error('打卡失败:', error);
    }
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || '',
      points: task.points,
      category: task.category || ''
    });
    setShowEditTaskModal(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/tasks/${selectedTask.id}`, taskFormData);
      setShowEditTaskModal(false);
      setSelectedTask(null);
      setTaskFormData({
        title: '',
        description: '',
        points: 10,
        category: ''
      });
      fetchDashboardData();
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        fetchDashboardData();
      } catch (error) {
        console.error('删除任务失败:', error);
      }
    }
  };

  // 奖励管理函数
  const handleCreateReward = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/rewards', rewardFormData);
      setShowCreateRewardModal(false);
      setRewardFormData({
        title: '',
        description: '',
        points_required: 50
      });
      fetchDashboardData();
      fetchPointsBalance();
    } catch (error) {
      console.error('创建奖励失败:', error);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/rewards/${selectedReward.id}/redeem`);
      setShowRedeemModal(false);
      setSelectedReward(null);
      fetchDashboardData();
      fetchPointsBalance();
    } catch (error) {
      console.error('兑换失败:', error);
    }
  };

  const handleEditReward = (reward) => {
    setSelectedReward(reward);
    setRewardFormData({
      title: reward.title,
      description: reward.description || '',
      points_required: reward.points_required
    });
    setShowEditRewardModal(true);
  };

  const handleUpdateReward = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/rewards/${selectedReward.id}`, rewardFormData);
      setShowEditRewardModal(false);
      setSelectedReward(null);
      setRewardFormData({
        title: '',
        description: '',
        points_required: 50
      });
      fetchDashboardData();
    } catch (error) {
      console.error('更新奖励失败:', error);
    }
  };

  const handleDeleteReward = async (rewardId) => {
    if (window.confirm('确定要删除这个奖励吗？')) {
      try {
        await axios.delete(`/api/rewards/${rewardId}`);
        fetchDashboardData();
      } catch (error) {
        console.error('删除奖励失败:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getPointsTypeColor = (type) => {
    return type === 'earned' ? 'text-success-600' : 'text-red-600';
  };

  const getPointsTypeIcon = (type) => {
    return type === 'earned' ? '+' : '-';
  };

  // 计划日期状态
  const [planStartDate, setPlanStartDate] = useState('2025-07-01');
  const [planEndDate, setPlanEndDate] = useState('2025-08-31');
  const [showPlanModal, setShowPlanModal] = useState(false);

  // 计算计划天数
  const calculatePlanDays = () => {
    const startDate = new Date(planStartDate);
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  // 计算计划进度百分比
  const calculatePlanProgress = () => {
    const startDate = new Date(planStartDate);
    const endDate = new Date(planEndDate);
    const today = new Date();
    
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const passedDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, Math.min(100, Math.round((passedDays / totalDays) * 100)));
  };

  // 计算奖励完成率
  const calculateRewardProgress = () => {
    if (rewards.length === 0) return 0;
    const redeemedRewards = rewards.filter(reward => reward.redeemed);
    return Math.round((redeemedRewards.length / rewards.length) * 100);
  };

  // 生成图表数据
  const generateChartData = () => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    // 从checkins数据中统计每日完成的任务数
    const dailyCompletions = {};
    checkins.forEach(checkin => {
      const checkDate = new Date(checkin.checked_at).toISOString().split('T')[0];
      if (last7Days.includes(checkDate)) {
        dailyCompletions[checkDate] = (dailyCompletions[checkDate] || 0) + 1;
      }
    });

    const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const completedTasks = last7Days.map(date => dailyCompletions[date] || 0);

    return {
      labels,
      datasets: [
        {
          label: '已完成任务',
          data: completedTasks,
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 15
      }
    }
  };

  // 颜色池 - 10种独特的颜色
  const colorPalette = [
    { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
    { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500' },
    { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-500' },
    { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500' },
    { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-500' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-500' },
    { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-500' },
    { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500' },
    { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500' },
    { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-500' }
  ];

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

  // 获取任务分类统计
  const getTaskCategories = () => {
    const categories = {};
    tasks.forEach(task => {
      const category = task.category || '其他';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category]++;
    });

    return Object.entries(categories).map(([name, count]) => {
      const color = getCategoryColor(name);
      return {
        name,
        count,
        color: `${color.bg} ${color.text}`
      };
    });
  };

  // 获取任务分类的边框颜色（用于任务前的线条）
  const getCategoryBorderColor = (category) => {
    const color = getCategoryColor(category);
    return color.border;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // 未登录用户的演示数据
  const demoTasks = [
    { id: 1, title: '学习React', description: '完成React基础教程', points: 10, category: '学习', checked_today: false, created_at: new Date() },
    { id: 2, title: '跑步30分钟', description: '在公园慢跑', points: 15, category: '运动', checked_today: true, created_at: new Date() },
    { id: 3, title: '阅读《原子习惯》', description: '阅读第5-6章', points: 8, category: '阅读', checked_today: false, created_at: new Date() }
  ];

  const demoStats = {
    total_tasks: 3,
    today_checkins: 1,
    total_earned: 23,
    total_spent: 0,
    balance: 23,
    completion_rate: 33.3,
    total_checkins: 1
  };

  const displayTasks = user ? tasks : demoTasks;
  const displayStats = user ? stats : demoStats;
  const displayPointsBalance = user ? pointsBalance : 23;

  return (
    <div className="space-y-6">
      
      {/* 未登录提示 */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">欢迎体验打卡工具！</h3>
                <p className="text-blue-700">当前为演示模式，登录后可以创建和管理您的个人任务</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <a href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                立即登录
              </a>
              <a href="/register" className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 px-4 py-2 rounded-lg transition-colors">
                免费注册
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* 合并的计划进度和今日任务区域 */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-500 rounded-3xl p-8 text-white shadow-cute">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-2">
            <Heart className="h-8 w-8 mr-3" />
            <h1 className="text-4xl font-bold">
              {user?.username || '访客'}，加油！
            </h1>
          </div>
          <p className="text-pink-100 text-lg mb-4">
            离目标又近了一步！
          </p>
          <div className="flex justify-center mb-4">
            <div className="relative inline-block cursor-pointer" onClick={() => user && setShowPlanModal(true)}>
              <span className="inline-block bg-white/20 text-white font-medium px-6 py-3 rounded-full shadow-lg hover:bg-white/30 transition-all duration-300">
                今日是计划第 <span className="font-bold">{calculatePlanDays()}</span> 天
              </span>
              <div className="absolute -top-2 -right-2 bg-success-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                进行中
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <CheckSquare className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今日任务数</p>
              <p className="text-2xl font-bold text-gray-900">
                {displayTasks.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今日完成率</p>
              <p className="text-2xl font-bold text-gray-900">
                {displayTasks.length > 0 ? Math.round((displayTasks.filter(task => task.checked_today).length / displayTasks.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Star className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">积分余额</p>
              <p className="text-2xl font-bold text-gray-900">
                {displayPointsBalance}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">今日打卡</p>
              <p className="text-2xl font-bold text-gray-900">
                {displayTasks.filter(task => task.checked_today).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 今日任务区域 */}
      <section className="mb-12">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h3 className="text-2xl font-bold flex items-center">
            <i className="fas fa-tasks text-primary-600 mr-2"></i> 今日任务
          </h3>
          <div className="mt-2 md:mt-0">
            <button 
              onClick={() => user ? setShowCreateTaskModal(true) : alert('请先登录后再创建任务')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <i className="fas fa-plus mr-2"></i> 添加任务
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* 任务分类标签 - 直接显示在任务列表上方 */}
          {displayTasks.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {getTaskCategories().map((category) => (
                <span key={category.name} className={`${category.color} px-3 py-1 rounded-full text-sm font-medium`}>
                  {category.name} <span className="ml-1 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{category.count}</span>
                </span>
              ))}
            </div>
          )}
          
          {/* 任务列表 */}
          <div className="flex justify-between items-center mb-4">
            <span className="bg-primary-100 text-primary-600 px-2 py-1 rounded-full text-sm">{displayTasks.length}项任务</span>
          </div>
          
          <div className="space-y-4">
            {displayTasks
              .sort((a, b) => {
                // 未完成的任务排在前面，已完成的任务排在后面
                if (a.checked_today !== b.checked_today) {
                  return a.checked_today ? 1 : -1;
                }
                // 同状态下按创建时间排序
                return new Date(b.created_at) - new Date(a.created_at);
              })
              .map((task) => {
                console.log('user.id:', user && user.id, 'task.created_by:', task.created_by, task);
                return (
              <div key={task.id} className={`task-item border-l-4 ${task.checked_today ? 'bg-green-50' : ''} ${task.checked_today ? 'border-green-500' : getCategoryBorderColor(task.category || '其他')} p-4 rounded-r-lg hover:bg-gray-50 transition-colors`}>
                <div className="flex items-start justify-between">
                  <div className="flex flex-1">
                    <div className="mr-3 mt-0.5">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-primary-600 rounded"
                        checked={task.checked_today}
                        onChange={() => {
                          if (!task.checked_today) {
                            if (!user) {
                              alert('请先登录后再进行打卡');
                              return;
                            }
                            setSelectedTask(task);
                            setShowCheckinModal(true);
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h5 className={`font-medium ${task.checked_today ? 'line-through opacity-70' : ''}`}>{task.title}</h5>
                      {task.description && (
                        <p className={`text-sm text-gray-600 mt-1 ${task.checked_today ? 'line-through opacity-70' : ''}`}>{task.description}</p>
                      )}
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <span className={`${getCategoryColor(task.category || '其他').bg} ${getCategoryColor(task.category || '其他').text} px-2 py-0.5 rounded-full text-xs mr-2`}>
                          {task.category || '其他'}
                        </span>
                        <span><i className="fas fa-gem mr-1"></i> {task.points}积分</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end ml-4">
                    <div className="flex items-center space-x-2 mb-2">
                      {user && String(task.created_by) === String(user.id) && (
                        <>
                          <button 
                            onClick={() => handleEditTask(task)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            title="编辑任务"
                          >
                            <i className="fas fa-edit text-sm"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="删除任务"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        </>
                      )}
                    </div>
                    <span className="text-primary-600 font-bold">+{task.points}</span>
                    <span className="text-xs text-gray-500">积分</span>
                  </div>
                </div>
              </div>
            )})}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">今日可获得积分：</span>
                <span className="text-2xl font-bold text-primary-600">
                  {displayTasks.reduce((sum, task) => sum + task.points, 0)}
                </span>
              </div>
              <button 
                onClick={() => !user && alert('请先登录后再使用此功能')}
                className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                一键完成所有任务
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 奖励兑换区域 */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">奖励兑换</h2>
            <p className="text-gray-600 text-lg">
              创建和兑换奖励
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-warning-50 px-4 py-2 rounded-lg">
              <Star className="h-5 w-5 text-warning-600 mr-2" />
              <span className="font-semibold text-warning-900">
                {pointsBalance} 积分
              </span>
            </div>
            <button
              onClick={() => setShowCreateRewardModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              创建奖励
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <div key={reward.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{reward.title}</h3>
                  {reward.description && (
                    <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-warning-500" />
                      {reward.points_required} 积分
                    </div>
                  </div>
                  {reward.created_by_name && (
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <User className="h-4 w-4 mr-1" />
                      创建者: {reward.created_by_name}
                    </div>
                  )}
                </div>
                {user && String(reward.created_by) === String(user.id) && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditReward(reward)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteReward(reward.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  {new Date(reward.created_at).toLocaleDateString()}
                </div>
                <button
                  onClick={() => {
                    setSelectedReward(reward);
                    setShowRedeemModal(true);
                  }}
                  disabled={pointsBalance < reward.points_required}
                  className={`flex items-center text-sm ${
                    pointsBalance >= reward.points_required
                      ? 'btn-success'
                      : 'btn-secondary opacity-50 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  {pointsBalance >= reward.points_required ? '兑换' : '积分不足'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {rewards.length === 0 && (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无奖励</h3>
            <p className="text-gray-500">
              创建一个新奖励开始吧！
            </p>
          </div>
        )}
      </div>

      {/* 数据统计区域 */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">数据统计</h2>
        
        {/* 积分历史 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">积分历史</h3>
          <div className="space-y-3">
            {pointsHistory.length > 0 ? (
              pointsHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{record.description}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(record.created_at)}
                    </div>
                  </div>
                  <div className={`font-semibold ${getPointsTypeColor(record.type)}`}>
                    {getPointsTypeIcon(record.type)}{record.points}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">暂无积分记录</p>
            )}
          </div>
        </div>

        {/* 打卡记录 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">打卡记录</h3>
          <div className="space-y-3">
            {checkins.length > 0 ? (
              checkins.map((checkin) => (
                <div key={checkin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{checkin.task_title}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(checkin.checked_at)}
                    </div>
                    {checkin.notes && (
                      <div className="text-sm text-gray-600 mt-1">{checkin.notes}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {checkin.points} 积分
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">暂无打卡记录</p>
            )}
          </div>
        </div>

        {/* 计划进度趋势 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-calendar-check text-primary-600 mr-2"></i> 计划进度趋势
          </h3>
          
          {/* 暑假进度卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* 总体进度卡片 */}
            <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover card-transition p-6 transform hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-gray-600 font-medium">计划进度</h4>
                  <p className="text-3xl font-bold mt-1">{calculatePlanProgress()}%</p>
                </div>
                <div className="bg-primary-100 p-3 rounded-full">
                  <i className="fas fa-calendar text-primary-600 text-xl"></i>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden">
                <div className="bg-primary-600 h-3 rounded-full progress-bar" style={{ width: `${calculatePlanProgress()}%` }}></div>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                <span>已完成: {calculatePlanDays()}天</span>
                <span className="mx-2">|</span>
                <span>剩余: {Math.ceil((new Date(planEndDate) - new Date(planStartDate)) / (1000 * 60 * 60 * 24)) - calculatePlanDays()}天</span>
              </div>
            </div>
            
            {/* 任务完成卡片 */}
            <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover card-transition p-6 transform hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-gray-600 font-medium">任务完成率</h4>
                  <p className="text-3xl font-bold mt-1">{tasks.length > 0 ? Math.round((tasks.filter(task => task.checked_today).length / tasks.length) * 100) : 0}%</p>
                </div>
                <div className="bg-success-100 p-3 rounded-full">
                  <i className="fas fa-check-circle text-success-600 text-xl"></i>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden">
                <div className="bg-success-600 h-3 rounded-full progress-bar" style={{ width: `${tasks.length > 0 ? Math.round((tasks.filter(task => task.checked_today).length / tasks.length) * 100) : 0}%` }}></div>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                <span>已完成: {tasks.filter(task => task.checked_today).length}</span>
                <span className="mx-2">|</span>
                <span>待完成: {tasks.filter(task => !task.checked_today).length}</span>
              </div>
            </div>
            
            {/* 奖励获取卡片 */}
            <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover card-transition p-6 transform hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-gray-600 font-medium">奖励完成率</h4>
                  <p className="text-3xl font-bold mt-1">{calculateRewardProgress()}%</p>
                </div>
                <div className="bg-warning-100 p-3 rounded-full">
                  <i className="fas fa-star text-warning-600 text-xl"></i>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden">
                <div className="bg-warning-600 h-3 rounded-full progress-bar" style={{ width: `${calculateRewardProgress()}%` }}></div>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                <span>已获得: {rewards.filter(r => r.redeemed).length}/{rewards.length}</span>
                <span className="mx-2">|</span>
                <span>待解锁: {rewards.filter(r => !r.redeemed).length}</span>
              </div>
            </div>
          </div>
          

          
                      {/* 统计图表 */}
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex flex-wrap justify-between items-center mb-6">
                <h4 className="text-xl font-bold">任务完成趋势</h4>
                <div className="flex space-x-2 mt-2 md:mt-0">
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium">本周</button>
                  <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">本月</button>
                  <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">全部</button>
                </div>
              </div>
              <div className="h-80">
                <Line data={generateChartData()} options={chartOptions} />
              </div>
            </div>
        </div>
      </div>

      {/* 创建任务模态框 */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-8">
            <div className="flex items-center mb-6">
              <Heart className="h-6 w-6 text-pink-500 mr-3" />
              <h2 className="text-2xl font-bold text-pink-700">创建每日任务</h2>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label className="label">任务标题</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="输入任务标题..."
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({...taskFormData, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">任务描述</label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="描述一下这个任务..."
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">积分</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={taskFormData.points}
                    onChange={(e) => setTaskFormData({...taskFormData, points: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="label">分类</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="如：学习、运动"
                    value={taskFormData.category}
                    onChange={(e) => setTaskFormData({...taskFormData, category: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
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
      {showEditTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full p-8">
            <div className="flex items-center mb-6">
              <Edit className="h-6 w-6 text-blue-500 mr-3" />
              <h2 className="text-2xl font-bold text-blue-700">编辑任务</h2>
            </div>
            <form onSubmit={handleUpdateTask} className="space-y-5">
              <div>
                <label className="label">任务标题</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="输入任务标题..."
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({...taskFormData, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">任务描述</label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="描述一下这个任务..."
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">积分</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={taskFormData.points}
                    onChange={(e) => setTaskFormData({...taskFormData, points: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="label">分类</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="如：学习、运动"
                    value={taskFormData.category}
                    onChange={(e) => setTaskFormData({...taskFormData, category: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowEditTaskModal(false)}
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
              <h2 className="text-2xl font-bold text-green-700">今日打卡</h2>
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
                  确认今日打卡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 创建奖励模态框 */}
      {showCreateRewardModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">创建奖励</h2>
            <form onSubmit={handleCreateReward} className="space-y-4">
              <div>
                <label className="label">奖励标题</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={rewardFormData.title}
                  onChange={(e) => setRewardFormData({...rewardFormData, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">奖励描述</label>
                <textarea
                  className="input"
                  rows="3"
                  value={rewardFormData.description}
                  onChange={(e) => setRewardFormData({...rewardFormData, description: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">所需积分</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input"
                  value={rewardFormData.points_required}
                  onChange={(e) => setRewardFormData({...rewardFormData, points_required: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateRewardModal(false)}
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

      {/* 计划设置模态框 */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-calendar text-primary-600 mr-2"></i> 设置计划日期
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              setShowPlanModal(false);
            }} className="space-y-4">
              <div>
                <label className="label">计划开始日期</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={planStartDate}
                  onChange={(e) => setPlanStartDate(e.target.value)}
                />
              </div>
              
              <div>
                <label className="label">计划结束日期</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={planEndDate}
                  onChange={(e) => setPlanEndDate(e.target.value)}
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <i className="fas fa-info-circle mr-1"></i>
                  设置计划的开始和结束日期，系统将自动计算进度
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary flex-1">
                  保存设置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 编辑奖励模态框 */}
      {showEditRewardModal && selectedReward && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">编辑奖励</h2>
            <form onSubmit={handleUpdateReward} className="space-y-4">
              <div>
                <label className="label">奖励标题</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={rewardFormData.title}
                  onChange={(e) => setRewardFormData({...rewardFormData, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">奖励描述</label>
                <textarea
                  className="input"
                  rows="3"
                  value={rewardFormData.description}
                  onChange={(e) => setRewardFormData({...rewardFormData, description: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">所需积分</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input"
                  value={rewardFormData.points_required}
                  onChange={(e) => setRewardFormData({...rewardFormData, points_required: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditRewardModal(false)}
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

      {/* 兑换模态框 */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">兑换奖励</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">{selectedReward.title}</h3>
              <p className="text-sm text-gray-600">{selectedReward.description}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <Star className="h-4 w-4 mr-1 text-warning-500" />
                {selectedReward.points_required} 积分
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-warning-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">当前积分：</span>
                <span className="font-semibold text-warning-900">{pointsBalance}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-700">兑换后剩余：</span>
                <span className="font-semibold text-warning-900">
                  {pointsBalance - selectedReward.points_required}
                </span>
              </div>
            </div>
            
            <form onSubmit={handleRedeem} className="space-y-4">
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRedeemModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="btn-success flex-1">
                  确认兑换
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard; 