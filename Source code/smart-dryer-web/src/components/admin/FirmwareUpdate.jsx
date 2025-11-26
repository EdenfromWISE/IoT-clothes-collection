import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../firebase';
import mqtt from 'mqtt';

const FirmwareUpdate = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [firmwareFile, setFirmwareFile] = useState(null);
  const [firmwareVersion, setFirmwareVersion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [updateHistory, setUpdateHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [mqttClient, setMqttClient] = useState(null);

  // MQTT Configuration
  const brokerUrl = 'wss://999c6f482e8a40e9b4c517d807370b36.s1.eu.hivemq.cloud:8884/mqtt';
  const mqttOptions = {
    username: 'hirk1443',
    password: 'Hirk1443',
    clientId: `admin-ota-${Math.random().toString(16).substr(2, 8)}`,
  };

  useEffect(() => {
    fetchDevices();
    fetchUpdateHistory();
    
    // Connect to MQTT
    const client = mqtt.connect(brokerUrl, mqttOptions);
    
    client.on('connect', () => {
      console.log('MQTT connected for OTA');
    });
    
    client.on('error', (err) => {
      console.error('MQTT connection error:', err);
    });
    
    setMqttClient(client);
    
    return () => {
      if (client) client.end();
    };
  }, []);

  const fetchDevices = async () => {
    try {
      const devicesSnapshot = await getDocs(collection(db, 'devices'));
      const devicesList = devicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDevices(devicesList);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchUpdateHistory = async () => {
    try {
      const historyQuery = query(
        collection(db, 'firmwareUpdates'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const historySnapshot = await getDocs(historyQuery);
      const history = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUpdateHistory(history);
    } catch (error) {
      console.error('Error fetching update history:', error);
      setUpdateHistory([]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.bin')) {
        setFirmwareFile(file);
        setMessage('');
      } else {
        setMessage('❌ Vui lòng chọn file .bin');
        e.target.value = '';
      }
    }
  };

  const handleUpdate = async () => {
    if (!selectedDevice || !firmwareFile || !firmwareVersion) {
      setMessage('❌ Vui lòng chọn thiết bị, file firmware và nhập version');
      return;
    }

    if (!mqttClient || !mqttClient.connected) {
      setMessage('❌ MQTT chưa kết nối. Vui lòng thử lại.');
      return;
    }

    try {
      setUploading(true);
      setMessage('📤 Đang upload firmware...');

      // Giả lập upload file (trong thực tế cần Firebase Storage)
      // const storageRef = ref(storage, `firmware/${selectedDevice}/${firmwareFile.name}`);
      // await uploadBytes(storageRef, firmwareFile);
      // const downloadURL = await getDownloadURL(storageRef);
      
      // Mock URL cho demo
      const downloadURL = `https://firmware-server.com/${selectedDevice}/${firmwareVersion}/${firmwareFile.name}`;

      setMessage('📡 Đang gửi lệnh OTA đến thiết bị...');

      // Gửi lệnh OTA qua MQTT
      const otaCommand = {
        command: 'ota_update',
        version: firmwareVersion,
        url: downloadURL,
        size: firmwareFile.size,
        checksum: 'md5-hash-here' // Trong thực tế cần tính MD5
      };

      const otaTopic = `smartdryer/${selectedDevice}/ota`;
      mqttClient.publish(otaTopic, JSON.stringify(otaCommand), { qos: 1 }, async (err) => {
        if (err) {
          console.error('MQTT publish error:', err);
          setMessage('❌ Lỗi khi gửi lệnh OTA');
          setUploading(false);
          return;
        }

        // Lưu vào lịch sử
        await addDoc(collection(db, 'firmwareUpdates'), {
          deviceId: selectedDevice,
          version: firmwareVersion,
          fileName: firmwareFile.name,
          fileSize: firmwareFile.size,
          downloadURL: downloadURL,
          status: 'sent',
          timestamp: new Date()
        });

        setMessage('✅ Đã gửi lệnh OTA thành công! Thiết bị sẽ tự động cập nhật.');
        
        // Reset form
        setSelectedDevice('');
        setFirmwareFile(null);
        setFirmwareVersion('');
        document.getElementById('fileInput').value = '';
        
        // Refresh history
        fetchUpdateHistory();
        
        setUploading(false);
      });

    } catch (error) {
      console.error('Error during OTA update:', error);
      setMessage('❌ Lỗi: ' + error.message);
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      sent: { text: 'Đã gửi', color: '#3498db' },
      downloading: { text: 'Đang tải', color: '#f39c12' },
      installing: { text: 'Đang cài', color: '#9b59b6' },
      success: { text: 'Thành công', color: '#27ae60' },
      failed: { text: 'Thất bại', color: '#e74c3c' }
    };
    const badge = badges[status] || badges.sent;
    return (
      <span style={{ 
        padding: '0.25rem 0.75rem', 
        borderRadius: '12px', 
        fontSize: '0.85rem',
        fontWeight: '600',
        backgroundColor: badge.color,
        color: 'white'
      }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="firmware-update">
      <h2>🔄 Cập nhật Firmware từ xa (OTA)</h2>

      <div className="ota-section">
        <div className="ota-form">
          <h3>Gửi bản cập nhật mới</h3>
          
          <div className="form-group">
            <label>Chọn thiết bị:</label>
            <select 
              value={selectedDevice} 
              onChange={(e) => setSelectedDevice(e.target.value)}
              disabled={uploading}
            >
              <option value="">-- Chọn thiết bị --</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.name || device.id} ({device.status === 'online' ? '🟢 Online' : '⚫ Offline'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Version firmware:</label>
            <input 
              type="text" 
              value={firmwareVersion}
              onChange={(e) => setFirmwareVersion(e.target.value)}
              placeholder="Ví dụ: v1.2.3"
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label>File firmware (.bin):</label>
            <input 
              id="fileInput"
              type="file" 
              accept=".bin"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            {firmwareFile && (
              <div className="file-info">
                📁 {firmwareFile.name} ({(firmwareFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          {message && (
            <div className={`ota-message ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'}`}>
              {message}
            </div>
          )}

          <button 
            onClick={handleUpdate}
            disabled={uploading || !selectedDevice || !firmwareFile || !firmwareVersion}
            className="btn-send-ota"
          >
            {uploading ? '⏳ Đang xử lý...' : '🚀 Gửi bản cập nhật'}
          </button>

          <div className="ota-warning">
            ⚠️ <strong>Lưu ý:</strong> 
            <ul>
              <li>Thiết bị phải đang online để nhận lệnh OTA</li>
              <li>Đảm bảo thiết bị có đủ pin hoặc đang cắm sạc</li>
              <li>Quá trình cập nhật có thể mất 2-5 phút</li>
              <li>Không ngắt nguồn thiết bị trong khi cập nhật</li>
            </ul>
          </div>
        </div>

        <div className="ota-stats">
          <div className="stat-card-ota">
            <div className="stat-icon">📱</div>
            <div>
              <h4>{devices.length}</h4>
              <p>Tổng thiết bị</p>
            </div>
          </div>
          <div className="stat-card-ota">
            <div className="stat-icon">🟢</div>
            <div>
              <h4>{devices.filter(d => d.status === 'online').length}</h4>
              <p>Online</p>
            </div>
          </div>
          <div className="stat-card-ota">
            <div className="stat-icon">🔄</div>
            <div>
              <h4>{updateHistory.length}</h4>
              <p>Lần cập nhật</p>
            </div>
          </div>
        </div>
      </div>

      <div className="update-history">
        <h3>📋 Lịch sử cập nhật</h3>
        {updateHistory.length > 0 ? (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Thiết bị</th>
                  <th>Version</th>
                  <th>File</th>
                  <th>Kích thước</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {updateHistory.map(record => (
                  <tr key={record.id}>
                    <td>
                      {record.timestamp 
                        ? new Date(record.timestamp.seconds * 1000).toLocaleString('vi-VN')
                        : 'N/A'}
                    </td>
                    <td className="device-id">{record.deviceId}</td>
                    <td><strong>{record.version}</strong></td>
                    <td>{record.fileName}</td>
                    <td>{(record.fileSize / 1024).toFixed(2)} KB</td>
                    <td>{getStatusBadge(record.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-history">Chưa có lịch sử cập nhật firmware</div>
        )}
      </div>
    </div>
  );
};

export default FirmwareUpdate;
