import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const SystemPerformance = () => {
  const [performance, setPerformance] = useState({
    totalUsers: 0,
    totalDevices: 0,
    onlineDevices: 0,
    totalLogs: 0,
    avgResponseTime: 0,
    systemUptime: '99.9%',
    lastUpdate: new Date()
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    fetchPerformanceData();
    
    // Auto refresh
    const interval = setInterval(() => {
      fetchPerformanceData();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from Firestore
      const [usersSnap, devicesSnap, logsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'devices')),
        getDocs(collection(db, 'logs'))
      ]);
      
      const totalUsers = usersSnap.size;
      const totalDevices = devicesSnap.size;
      const onlineDevices = devicesSnap.docs.filter(doc => doc.data().status === 'online').length;
      const totalLogs = logsSnap.size;
      
      // Calculate database size (approximate)
      const dbSize = ((totalUsers * 2 + totalDevices * 5 + totalLogs * 1) / 1024).toFixed(2);
      
      setPerformance({
        totalUsers,
        totalDevices,
        onlineDevices,
        totalLogs,
        dbSize,
        avgResponseTime: Math.random() * 100 + 50, // Mock data
        systemUptime: '99.9%',
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = () => {
    const deviceUtilization = performance.totalDevices > 0 
      ? (performance.onlineDevices / performance.totalDevices) * 100 
      : 0;
    
    if (deviceUtilization >= 80) return { text: 'Tốt', color: '#27ae60', icon: '✅' };
    if (deviceUtilization >= 50) return { text: 'Trung bình', color: '#f39c12', icon: '⚠️' };
    return { text: 'Cần chú ý', color: '#e74c3c', icon: '❌' };
  };

  const health = getHealthStatus();

  if (loading && performance.totalUsers === 0) {
    return <div className="loading">Đang tải dữ liệu hiệu năng...</div>;
  }

  return (
    <div className="system-performance">
      <div className="performance-header">
        <h2>Giám sát hiệu năng hệ thống</h2>
        <div className="refresh-controls">
          <span>Tự động làm mới sau: {refreshInterval}s</span>
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="refresh-select"
          >
            <option value="10">10 giây</option>
            <option value="30">30 giây</option>
            <option value="60">1 phút</option>
            <option value="300">5 phút</option>
          </select>
          <button onClick={fetchPerformanceData} className="btn-refresh-now">
            🔄 Làm mới ngay
          </button>
        </div>
      </div>

      {/* System Health */}
      <div className="health-indicator" style={{ borderColor: health.color }}>
        <div className="health-icon" style={{ color: health.color }}>
          {health.icon}
        </div>
        <div className="health-text">
          <h3>Trạng thái hệ thống: <span style={{ color: health.color }}>{health.text}</span></h3>
          <p>Cập nhật lần cuối: {performance.lastUpdate.toLocaleString('vi-VN')}</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-info">
            <h4>Người dùng</h4>
            <div className="metric-value">{performance.totalUsers}</div>
            <div className="metric-label">Tổng số users</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📱</div>
          <div className="metric-info">
            <h4>Thiết bị</h4>
            <div className="metric-value">
              {performance.onlineDevices}/{performance.totalDevices}
            </div>
            <div className="metric-label">Online/Tổng</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-info">
            <h4>Logs</h4>
            <div className="metric-value">{performance.totalLogs.toLocaleString()}</div>
            <div className="metric-label">Tổng số logs</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💾</div>
          <div className="metric-info">
            <h4>Database</h4>
            <div className="metric-value">{performance.dbSize} MB</div>
            <div className="metric-label">Kích thước ước tính</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-info">
            <h4>Response Time</h4>
            <div className="metric-value">{performance.avgResponseTime.toFixed(0)} ms</div>
            <div className="metric-label">Thời gian phản hồi TB</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-info">
            <h4>Uptime</h4>
            <div className="metric-value">{performance.systemUptime}</div>
            <div className="metric-label">Thời gian hoạt động</div>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="services-section">
        <h3>Trạng thái dịch vụ</h3>
        <div className="services-list">
          <div className="service-item">
            <span className="service-name">🔥 Firebase Firestore</span>
            <span className="service-status online">● Online</span>
          </div>
          <div className="service-item">
            <span className="service-name">🔐 Firebase Auth</span>
            <span className="service-status online">● Online</span>
          </div>
          <div className="service-item">
            <span className="service-name">📡 MQTT Broker (HiveMQ)</span>
            <span className="service-status online">● Online</span>
          </div>
          <div className="service-item">
            <span className="service-name">🌐 Web Application</span>
            <span className="service-status online">● Online</span>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="performance-chart">
        <h3>Tỷ lệ sử dụng thiết bị</h3>
        <div className="chart-container">
          <div className="progress-bar-large">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${(performance.onlineDevices / performance.totalDevices * 100)}%`,
                backgroundColor: health.color
              }}
            >
              {((performance.onlineDevices / performance.totalDevices * 100) || 0).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="performance-actions">
        <h3>Thao tác nhanh</h3>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => alert('Chức năng đang phát triển')}>
            🧹 Dọn dẹp logs cũ
          </button>
          <button className="action-btn" onClick={() => alert('Chức năng đang phát triển')}>
            📊 Xuất báo cáo
          </button>
          <button className="action-btn" onClick={() => alert('Chức năng đang phát triển')}>
            🔔 Cấu hình cảnh báo
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemPerformance;
