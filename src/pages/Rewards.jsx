import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  Plus, 
  Gift, 
  Star,
  Edit,
  Trash2,
  User,
  ShoppingCart
} from 'lucide-react';

function Rewards() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_required: 50
  });

  useEffect(() => {
    fetchRewards();
    fetchPointsBalance();
  }, []);

  const fetchRewards = async () => {
    try {
      const response = await axios.get('/api/rewards');
      setRewards(response.data);
    } catch (error) {
      console.error('获取奖励失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPointsBalance = async () => {
    try {
      const response = await axios.get('/api/points/balance');
      setPointsBalance(response.data.balance);
    } catch (error) {
      console.error('获取积分余额失败:', error);
    }
  };

  const handleCreateReward = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/rewards', formData);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        points_required: 50
      });
      fetchRewards();
    } catch (error) {
      console.error('创建奖励失败:', error);
    }
  };

  const handleEditReward = (reward) => {
    console.log('handleEditReward 被调用', reward);
    setSelectedReward(reward);
    setFormData({
      title: reward.title,
      description: reward.description || '',
      points_required: reward.points_required
    });
    setShowEditModal(true);
  };

  const handleUpdateReward = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/rewards/${selectedReward.id}`, formData);
      setShowEditModal(false);
      setSelectedReward(null);
      setFormData({
        title: '',
        description: '',
        points_required: 50
      });
      fetchRewards();
    } catch (error) {
      console.error('更新奖励失败:', error);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/rewards/${selectedReward.id}/redeem`);
      setShowRedeemModal(false);
      setSelectedReward(null);
      fetchRewards();
      fetchPointsBalance();
    } catch (error) {
      console.error('兑换失败:', error);
    }
  };

  const handleDeleteReward = async (rewardId) => {
    if (window.confirm('确定要删除这个奖励吗？')) {
      try {
        await axios.delete(`/api/rewards/${rewardId}`);
        fetchRewards();
      } catch (error) {
        console.error('删除奖励失败:', error);
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

  console.log('showEditModal', showEditModal, 'selectedReward', selectedReward);

  return (
    <div className="space-y-6">
      {/* 页面标题和积分余额 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">奖励兑换</h1>
          <p className="text-gray-600">
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
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            创建奖励
          </button>
        </div>
      </div>

      {/* 奖励列表 */}
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
              {String(reward.created_by) === String(user.id) && (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => { 
                      console.log('点击编辑奖励', reward); 
                      handleEditReward(reward); 
                    }}
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

      {/* 创建奖励模态框 */}
      {showCreateModal && (
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
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">奖励描述</label>
                <textarea
                  className="input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">所需积分</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input"
                  value={formData.points_required}
                  onChange={(e) => setFormData({...formData, points_required: parseInt(e.target.value)})}
                />
              </div>
              

              
              <div className="flex space-x-3 pt-4">
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

      {/* 编辑奖励模态框 */}
      {showEditModal && selectedReward && (
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
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">奖励描述</label>
                <textarea
                  className="input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">所需积分</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input"
                  value={formData.points_required}
                  onChange={(e) => setFormData({...formData, points_required: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
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
    </div>
  );
}

export default Rewards; 