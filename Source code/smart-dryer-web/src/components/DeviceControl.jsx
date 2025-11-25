import { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const DeviceControl = ({ deviceId, onDisconnect }) => {
  const [client, setClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Đang kết nối...');
  const [deviceStatus, setDeviceStatus] = useState(null);

  // State cho các cài đặt
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [rhCloseHigh, setRhCloseHigh] = useState(85);
  const [luxOpenThresh, setLuxOpenThresh] = useState(15000);
  const [luxCloseThresh, setLuxCloseThresh] = useState(2000);

  // Thông tin kết nối MQTT (lấy từ firmware)
  const brokerUrl = 'wss://999c6f482e8a40e9b4c517d807370b36.s1.eu.hivemq.cloud:8884/mqtt'; // Giữ MQTT cho lệnh điều khiển
  const options = {
    username: 'hirk1443',
    password: 'Hirk1443',
    clientId: `web-client-${Math.random().toString(16).substr(2, 8)}`,
  };

  const statusTopic = `smartdryer/${deviceId}/status`;
  const commandTopic = `smartdryer/${deviceId}/command`; // Giữ MQTT cho lệnh điều khiển

  useEffect(() => {
    // ===== MQTT Client for Commands =====
    const mqttClient = mqtt.connect(brokerUrl, options);
    setClient(mqttClient);

    mqttClient.on('connect', () => {
      setConnectionStatus('Đã kết nối');
      // Subscribe cả topic status và command
      mqttClient.subscribe([statusTopic, commandTopic], (err) => {
        if (err) {
          console.error('Subscribe to command topic failed:', err);
          setConnectionStatus('Lỗi Subcribe');
        }
      });
    });

    mqttClient.on('message', (topic, payload) => {
      if (topic === statusTopic) {
        // Xử lý status từ MQTT
        try {
          const status = JSON.parse(payload.toString());
          setDeviceStatus(status);
          // Đồng bộ trạng thái Auto Mode từ thiết bị
          setIsAutoMode(status.mode === 1); // 1 là AUTO trong enum của firmware
        } catch (e) {
          console.error('Failed to parse device status:', e);
        }
      }
    });
    mqttClient.on('error', (err) => {
      console.error('Connection error: ', err);
      setConnectionStatus('Lỗi kết nối');
      mqttClient.end();
    });

    mqttClient.on('reconnect', () => {
      setConnectionStatus('Đang kết nối lại...');
    });

    mqttClient.on('close', () => {
      setConnectionStatus('Đã ngắt kết nối');
    });
    // ===== End MQTT Client =====

    // Dọn dẹp khi component bị unmount
    return () => {
      if (mqttClient) mqttClient.end();
    };
  }, [deviceId]); // Chạy lại effect này nếu deviceId thay đổi

  const sendCommand = (command) => {
    if (client && client.connected) {
      const payload = JSON.stringify({ command: command });
      client.publish(commandTopic, payload, (err) => {
        if (err) {
          console.error('Publish failed:', err);
        }
      });
    }
  };

  const sendConfig = (config) => {
    if (client && client.connected) {
      client.publish(commandTopic, JSON.stringify(config), (err) => {
        if (err) {
          console.error('Publish config failed:', err);
        }
      });
    }
  };

  const handleAutoModeToggle = (e) => {
    const newIsAuto = e.target.checked;
    setIsAutoMode(newIsAuto);
    sendConfig({ mode: newIsAuto ? 'auto' : 'manual' });
  };

  // Xác định xem motor có đang di chuyển không
  const isMoving =
    deviceStatus?.position === 3 || // POS_MOVING_OPEN
    deviceStatus?.position === 4; // POS_MOVING_CLOSE

  const positionMap = {
    0: 'Không xác định',
    1: 'Đã mở',
    2: 'Đã đóng',
    3: 'Đang mở...',
    4: 'Đang đóng...',
  };

  return (
    <div className="control-container">
      <h2>Bảng điều khiển</h2>
      <div className="connection-status">
        <span>Trạng thái: {connectionStatus}</span>
        <button onClick={onDisconnect} className="disconnect-btn">
          Ngắt kết nối
        </button>
      </div>

      {deviceStatus ? ( // Chỉ hiển thị khi đã có dữ liệu
        <div className="device-content">
          {/* Lưới trạng thái */}
          <div className="status-grid">
            <div className="status-card">Nhiệt độ: {deviceStatus.temperature?.toFixed(1) ?? '--'}°C</div>
            <div className="status-card">Độ ẩm: {deviceStatus.humidity?.toFixed(1) ?? '--'}%</div>
            <div className="status-card">Ánh sáng: {deviceStatus.lux?.toFixed(0) ?? '--'} lux</div>
            <div className="status-card">Vị trí: {positionMap[deviceStatus.position] || 'N/A'}</div>
          </div>

          {/* Bảng điều khiển thủ công */}
          {!isAutoMode && (
            <div className="control-panel">
              <button onClick={() => sendCommand('open')} disabled={isMoving}>Mở</button>
              <button onClick={() => sendCommand('stop')} className="stop-btn" disabled={!isMoving}>Dừng</button>
              <button onClick={() => sendCommand('close')} disabled={isMoving}>Đóng</button>
            </div>
          )}

          {/* Cài đặt chế độ tự động */}
          <div className="settings-card">
            <div className="settings-header">
              <h3>Cài đặt chế độ tự động</h3>
              <label className="switch">
                <input type="checkbox" checked={isAutoMode} onChange={handleAutoModeToggle} />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="slider-group">
              <label>Đóng khi độ ẩm &gt;= {rhCloseHigh}%</label>
              <input
                type="range"
                min="50"
                max="95"
                value={rhCloseHigh}
                onChange={(e) => setRhCloseHigh(Number(e.target.value))}
                onMouseUp={() => sendConfig({ rh_high: rhCloseHigh })}
                onTouchEnd={() => sendConfig({ rh_high: rhCloseHigh })}
                disabled={!isAutoMode}
              />
            </div>
            <div className="slider-group">
              <label>Mở khi ánh sáng &gt; {luxOpenThresh} lux</label>
              <input
                type="range"
                min="1000"
                max="40000"
                step="1000"
                value={luxOpenThresh}
                onChange={(e) => setLuxOpenThresh(Number(e.target.value))}
                onMouseUp={() => sendConfig({ lux_open: luxOpenThresh })}
                onTouchEnd={() => sendConfig({ lux_open: luxOpenThresh })}
                disabled={!isAutoMode}
              />
            </div>
            <div className="slider-group">
              <label>Đóng khi ánh sáng &lt; {luxCloseThresh} lux</label>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={luxCloseThresh}
                onChange={(e) => setLuxCloseThresh(Number(e.target.value))}
                onMouseUp={() => sendConfig({ lux_close: luxCloseThresh })}
                onTouchEnd={() => sendConfig({ lux_close: luxCloseThresh })}
                disabled={!isAutoMode}
              />
            </div>
          </div>
        </div>
      ) : (
        <p>Đang chờ dữ liệu từ thiết bị...</p>
      )}
    </div>
  );
};

export default DeviceControl;