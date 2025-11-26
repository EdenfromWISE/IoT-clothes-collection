import { useState, useEffect } from 'react';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import { db } from '../../firebase';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(100);

  useEffect(() => {
    fetchLogs();
  }, [displayLimit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const logsQuery = query(
        collection(db, 'logs'),
        limit(displayLimit)
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      const logsList = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sắp xếp theo timestamp giảm dần
      logsList.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return b.timestamp.seconds - a.timestamp.seconds;
        }
        return 0;
      });
      
      setLogs(logsList);
    } catch (error) {
      console.error('Error fetching logs:', error);
      alert('Lỗi khi tải nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchType = filterType === 'all' || log.action === filterType;
    const matchSearch = 
      log.deviceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const getLogTypeColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'open': return '#27ae60';
      case 'close': return '#e74c3c';
      case 'stop': return '#f39c12';
      case 'error': return '#c0392b';
      default: return '#3498db';
    }
  };

  if (loading) {
    return <div className="loading">Đang tải nhật ký hệ thống...</div>;
  }

  return (
    <div className="system-logs">
      <div className="logs-header">
        <h2>Nhật ký hệ thống</h2>
        <div className="logs-controls">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả hành động</option>
            <option value="open">Mở</option>
            <option value="close">Đóng</option>
            <option value="stop">Dừng</option>
            <option value="error">Lỗi</option>
          </select>
          
          <select 
            value={displayLimit} 
            onChange={(e) => setDisplayLimit(Number(e.target.value))}
            className="filter-select"
          >
            <option value="50">50 logs</option>
            <option value="100">100 logs</option>
            <option value="200">200 logs</option>
            <option value="500">500 logs</option>
          </select>
          
          <input
            type="text"
            placeholder="Tìm kiếm logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <button onClick={fetchLogs} className="btn-refresh">
            🔄 Làm mới
          </button>
        </div>
      </div>

      <div className="logs-stats">
        <div className="stat-card">
          <h3>{logs.length}</h3>
          <p>Tổng số logs</p>
        </div>
        <div className="stat-card">
          <h3>{logs.filter(l => l.action === 'open').length}</h3>
          <p>Hành động mở</p>
        </div>
        <div className="stat-card">
          <h3>{logs.filter(l => l.action === 'close').length}</h3>
          <p>Hành động đóng</p>
        </div>
        <div className="stat-card">
          <h3>{logs.filter(l => l.action === 'error').length}</h3>
          <p>Lỗi</p>
        </div>
      </div>

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Thiết bị</th>
              <th>Hành động</th>
              <th>Trạng thái</th>
              <th>Nhiệt độ</th>
              <th>Độ ẩm</th>
              <th>Ánh sáng</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td>
                  {log.timestamp 
                    ? new Date(log.timestamp.seconds * 1000).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })
                    : 'N/A'}
                </td>
                <td className="device-id">{log.deviceId || 'N/A'}</td>
                <td>
                  <span 
                    className="log-type-badge" 
                    style={{ backgroundColor: getLogTypeColor(log.action) }}
                  >
                    {log.action || 'N/A'}
                  </span>
                </td>
                <td>
                  <span className={`position-badge position-${log.position}`}>
                    {log.position === 1 ? 'Đã mở' :
                     log.position === 2 ? 'Đã đóng' :
                     log.position === 3 ? 'Đang mở...' :
                     log.position === 4 ? 'Đang đóng...' :
                     'N/A'}
                  </span>
                </td>
                <td>{log.temp ? `${log.temp.toFixed(1)}°C` : 'N/A'}</td>
                <td>{log.humidity ? `${log.humidity.toFixed(1)}%` : 'N/A'}</td>
                <td>{log.lux ? `${log.lux.toFixed(0)} lux` : 'N/A'}</td>
                <td className="log-description">{log.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div className="no-data">Không tìm thấy log nào</div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
