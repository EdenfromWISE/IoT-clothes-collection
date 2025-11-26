import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, where, limit } from 'firebase/firestore';
import { db } from '../../firebase';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceHistory, setDeviceHistory] = useState([]);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      
      // Lấy danh sách tất cả devices
      const devicesSnapshot = await getDocs(collection(db, 'devices'));
      const devicesList = await Promise.all(
        devicesSnapshot.docs.map(async (deviceDoc) => {
          const deviceData = deviceDoc.data();
          
          // Tìm user sở hữu device này
          let ownerEmail = 'N/A';
          try {
            const userDevicesQuery = query(
              collection(db, 'userDevices'),
              where('deviceId', '==', deviceDoc.id)
            );
            const userDevicesSnapshot = await getDocs(userDevicesQuery);
            
            if (!userDevicesSnapshot.empty) {
              const userId = userDevicesSnapshot.docs[0].data().userId;
              const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
              if (!userDoc.empty) {
                ownerEmail = userDoc.docs[0].data().email;
              }
            }
          } catch (error) {
            console.error('Error fetching owner:', error);
          }

          return {
            id: deviceDoc.id,
            ...deviceData,
            ownerEmail
          };
        })
      );

      setDevices(devicesList);
    } catch (error) {
      console.error('Error fetching devices:', error);
      alert('Lỗi khi tải danh sách thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      return;
    }

    try {
      // Xóa device
      await deleteDoc(doc(db, 'devices', deviceId));
      
      // Xóa liên kết userDevice
      const userDevicesQuery = query(
        collection(db, 'userDevices'),
        where('deviceId', '==', deviceId)
      );
      const userDevicesSnapshot = await getDocs(userDevicesQuery);
      await Promise.all(
        userDevicesSnapshot.docs.map(doc => deleteDoc(doc.ref))
      );

      setDevices(devices.filter(device => device.id !== deviceId));
      alert('Đã xóa thiết bị thành công');
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Lỗi khi xóa thiết bị');
    }
  };

  const viewDeviceDetails = async (device) => {
    setSelectedDevice(device);
    setDeviceHistory([]);
    
    // Lấy lịch sử hoạt động của thiết bị
    try {
      const historyQuery = query(
        collection(db, 'logs'),
        where('deviceId', '==', device.id),
        limit(50)
      );
      const historySnapshot = await getDocs(historyQuery);
      const history = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sắp xếp theo timestamp giảm dần ở client side
      history.sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return b.timestamp.seconds - a.timestamp.seconds;
        }
        return 0;
      });
      setDeviceHistory(history);
    } catch (error) {
      console.error('Error fetching device history:', error);
      // Nếu không có collection hoặc lỗi, để mảng rỗng
    }
  };

  const filteredDevices = devices.filter(device =>
    device.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.ownerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Đang tải danh sách thiết bị...</div>;
  }

  return (
    <div className="device-management">
      <div className="management-header">
        <h2>Quản lý thiết bị</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo ID, tên hoặc chủ sở hữu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="devices-stats">
        <div className="stat-card">
          <h3>{devices.length}</h3>
          <p>Tổng số thiết bị</p>
        </div>
        <div className="stat-card">
          <h3>{devices.filter(d => d.status === 'online').length}</h3>
          <p>Đang hoạt động</p>
        </div>
        <div className="stat-card">
          <h3>{devices.filter(d => d.status === 'offline').length}</h3>
          <p>Ngoại tuyến</p>
        </div>
      </div>

      <div className="devices-grid">
        {filteredDevices.map(device => (
          <div key={device.id} className="device-card">
            <div className="device-card-header">
              <h3>{device.name || device.id}</h3>
              <span className={`status-indicator ${device.status || 'unknown'}`}>
                {device.status === 'online' ? '● Online' : '○ Offline'}
              </span>
            </div>
            <div className="device-card-body">
              <p><strong>ID:</strong> {device.id}</p>
              <p><strong>Chủ sở hữu:</strong> {device.ownerEmail}</p>
              <p><strong>Loại:</strong> {device.type || 'Smart Dryer'}</p>
              {device.lastUpdate && (
                <p><strong>Cập nhật cuối:</strong> {new Date(device.lastUpdate.seconds * 1000).toLocaleString('vi-VN')}</p>
              )}
            </div>
            <div className="device-card-actions">
              <button
                onClick={() => viewDeviceDetails(device)}
                className="btn-view"
              >
                Chi tiết
              </button>
              <button
                onClick={() => handleDeleteDevice(device.id)}
                className="btn-delete"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="no-data">Không tìm thấy thiết bị nào</div>
      )}

      {/* Modal hiển thị chi tiết thiết bị */}
      {selectedDevice && (
        <div className="modal-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="modal-content device-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết thiết bị</h2>
              <button onClick={() => setSelectedDevice(null)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="device-info-section">
                <h3>Thông tin chung</h3>
                <p><strong>ID:</strong> {selectedDevice.id}</p>
                <p><strong>Tên:</strong> {selectedDevice.name || 'N/A'}</p>
                <p><strong>Chủ sở hữu:</strong> {selectedDevice.ownerEmail}</p>
                <p><strong>Trạng thái:</strong> {selectedDevice.status || 'Unknown'}</p>
                <p><strong>Loại:</strong> {selectedDevice.type || 'Smart Dryer'}</p>
                {selectedDevice.location && (
                  <p><strong>Vị trí:</strong> {selectedDevice.location}</p>
                )}
                {selectedDevice.lastUpdate && (
                  <p><strong>Cập nhật cuối:</strong> {new Date(selectedDevice.lastUpdate.seconds * 1000).toLocaleString('vi-VN')}</p>
                )}
              </div>

              <div className="sensor-data">
                <h3>Dữ liệu cảm biến gần nhất</h3>
                {selectedDevice.temperature && <p>Nhiệt độ: {selectedDevice.temperature}°C</p>}
                {selectedDevice.humidity && <p>Độ ẩm: {selectedDevice.humidity}%</p>}
                {selectedDevice.lux && <p>Ánh sáng: {selectedDevice.lux} lux</p>}
              </div>

              <div className="device-history-section">
                <h3>Lịch sử đóng mở (50 lần gần nhất)</h3>
                {deviceHistory.length > 0 ? (
                  <div className="history-table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Thời gian</th>
                          <th>Hành động</th>
                          <th>Trạng thái</th>
                          <th>Nhiệt độ</th>
                          <th>Độ ẩm</th>
                          <th>Ánh sáng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deviceHistory.map(record => (
                          <tr key={record.id}>
                            <td>
                              {record.timestamp 
                                ? new Date(record.timestamp.seconds * 1000).toLocaleString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })
                                : 'N/A'}
                            </td>
                            <td>
                              <span className={`action-badge ${record.action?.toLowerCase()}`}>
                                {record.action === 'open' ? '🔓 Mở' : 
                                 record.action === 'close' ? '🔒 Đóng' : 
                                 record.action === 'stop' ? '⏸️ Dừng' : 
                                 record.action || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <span className={`position-badge position-${record.position}`}>
                                {record.position === 1 ? 'Đã mở' :
                                 record.position === 2 ? 'Đã đóng' :
                                 record.position === 3 ? 'Đang mở...' :
                                 record.position === 4 ? 'Đang đóng...' :
                                 'N/A'}
                              </span>
                            </td>
                            <td>{record.temperature ? `${record.temperature.toFixed(1)}°C` : 'N/A'}</td>
                            <td>{record.humidity ? `${record.humidity.toFixed(1)}%` : 'N/A'}</td>
                            <td>{record.lux ? `${record.lux.toFixed(0)} lux` : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-history">Chưa có lịch sử hoạt động hoặc đang tải...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;
