import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  TrendingUp, 
  Star, 
  CheckSquare, 
  Gift,
  Calendar,
  BarChart3
} from 'lucide-react';

function Stats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    fetchStatsData();
  }, []);

  const fetchStatsData = async () => {
    try {
      const [statsRes, pointsRes, checkinsRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/points'),
        axios.get('/api/checkins')
      ]);

      setStats(statsRes.data);
      setPointsHistory(pointsRes.data);
      setCheckins(checkinsRes.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getPointsTypeColor = (type) => {
    return type === 'earned' ? 'text-success-600' : 'text-red-600';
  };

  const getPointsTypeIcon = (type) => {
    return type === 'earned' ? '+' : '-';
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
        <p className="text-gray-600">
          查看你的学习进度和积分记录
        </p>
      </div>

      {/* 总体统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <CheckSquare className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总任务数</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_tasks || 0}
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
              <p className="text-sm font-medium text-gray-600">完成率</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.completion_rate || 0}%
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
                {stats?.balance || 0}
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
              <p className="text-sm font-medium text-gray-600">打卡次数</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_checkins || 0}
              </p>
            </div>
          </div>
        </div>
      </div>



      {/* 积分历史 */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">积分历史</h2>
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
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">打卡记录</h2>
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

      {/* 图表区域（可以后续添加图表库） */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">进度趋势</h2>
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">图表功能开发中...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats; 