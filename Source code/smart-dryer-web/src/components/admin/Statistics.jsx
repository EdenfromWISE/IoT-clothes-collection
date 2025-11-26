import { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../firebase';

const Statistics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    activeDevices: 0,
    adminUsers: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // Lấy thống kê users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      const adminUsers = usersSnapshot.docs.filter(doc => doc.data().role === 'admin').length;

      // Lấy thống kê devices
      const devicesSnapshot = await getDocs(collection(db, 'devices'));
      const totalDevices = devicesSnapshot.size;
      const activeDevices = devicesSnapshot.docs.filter(doc => doc.data().status === 'online').length;

      // Lấy hoạt động gần đây (từ collection logs)
      let recentActivities = [];
      try {
        const activitiesQuery = query(
          collection(db, 'logs'),
          limit(10)
        );
        const activitiesSnapshot = await getDocs(activitiesQuery);
        recentActivities = activitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sắp xếp theo timestamp giảm dần ở client side
        recentActivities.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            return b.timestamp.seconds - a.timestamp.seconds;
          }
          return 0;
        });
      } catch (error) {
        console.log('No logs collection yet');
      }

      setStats({
        totalUsers,
        totalDevices,
        activeDevices,
        adminUsers,
        recentActivities
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      alert('Lỗi khi tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải thống kê...</div>;
  }

  const deviceUtilization = stats.totalDevices > 0 
    ? ((stats.activeDevices / stats.totalDevices) * 100).toFixed(1) 
    : 0;

  return (
    <div className="statistics">
      <h2>Thống kê tổng quan</h2>
      
      <div className="stats-grid">
        <div className="stat-card large">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Tổng số người dùng</p>
            <span className="stat-detail">{stats.adminUsers} quản trị viên</span>
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-icon">📱</div>
          <div className="stat-info">
            <h3>{stats.totalDevices}</h3>
            <p>Tổng số thiết bị</p>
            <span className="stat-detail">{stats.activeDevices} đang hoạt động</span>
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3>{deviceUtilization}%</h3>
            <p>Tỷ lệ hoạt động</p>
            <span className="stat-detail">Thiết bị online/tổng số</span>
          </div>
        </div>

        <div className="stat-card large">
          <div className="stat-icon">🔄</div>
          <div className="stat-info">
            <h3>{stats.recentActivities.length}</h3>
            <p>Hoạt động gần đây</p>
            <span className="stat-detail">Trong 24h qua</span>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Phân bố người dùng</h3>
          <div className="simple-chart">
            <div className="chart-bar">
              <div className="bar-label">Admin</div>
              <div className="bar-container">
                <div 
                  className="bar admin-bar" 
                  style={{ width: `${(stats.adminUsers / stats.totalUsers * 100)}%` }}
                >
                  {stats.adminUsers}
                </div>
              </div>
            </div>
            <div className="chart-bar">
              <div className="bar-label">User</div>
              <div className="bar-container">
                <div 
                  className="bar user-bar" 
                  style={{ width: `${((stats.totalUsers - stats.adminUsers) / stats.totalUsers * 100)}%` }}
                >
                  {stats.totalUsers - stats.adminUsers}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Trạng thái thiết bị</h3>
          <div className="simple-chart">
            <div className="chart-bar">
              <div className="bar-label">Online</div>
              <div className="bar-container">
                <div 
                  className="bar online-bar" 
                  style={{ width: `${(stats.activeDevices / stats.totalDevices * 100)}%` }}
                >
                  {stats.activeDevices}
                </div>
              </div>
            </div>
            <div className="chart-bar">
              <div className="bar-label">Offline</div>
              <div className="bar-container">
                <div 
                  className="bar offline-bar" 
                  style={{ width: `${((stats.totalDevices - stats.activeDevices) / stats.totalDevices * 100)}%` }}
                >
                  {stats.totalDevices - stats.activeDevices}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {stats.recentActivities.length > 0 && (
        <div className="recent-activities">
          <h3>Hoạt động gần đây</h3>
          <div className="activities-list">
            {stats.recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <span className="activity-time">
                  {activity.timestamp ? new Date(activity.timestamp.seconds * 1000).toLocaleString('vi-VN') : 'N/A'}
                </span>
                <span className="activity-description">{activity.description || activity.action}</span>
                <span className="activity-user">{activity.userEmail || activity.userId}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h3>Thao tác nhanh</h3>
        <div className="action-buttons">
          <button onClick={fetchStatistics} className="btn-refresh">
            🔄 Làm mới dữ liệu
          </button>
          <button onClick={() => window.print()} className="btn-export">
            📄 Xuất báo cáo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
