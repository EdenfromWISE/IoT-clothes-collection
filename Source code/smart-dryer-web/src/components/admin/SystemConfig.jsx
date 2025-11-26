import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const SystemConfig = () => {
  const [config, setConfig] = useState({
    systemName: 'Smart Dryer System',
    mqttBroker: 'wss://999c6f482e8a40e9b4c517d807370b36.s1.eu.hivemq.cloud:8884/mqtt',
    mqttUsername: 'hirk1443',
    defaultAutoMode: false,
    defaultRhHigh: 85,
    defaultLuxOpen: 15000,
    defaultLuxClose: 2000,
    maintenanceMode: false,
    maxDevicesPerUser: 10,
    logRetentionDays: 30
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const configDoc = await getDoc(doc(db, 'systemConfig', 'main'));
      
      if (configDoc.exists()) {
        setConfig({ ...config, ...configDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      await setDoc(doc(db, 'systemConfig', 'main'), {
        ...config,
        lastUpdated: new Date()
      });
      
      setMessage('✅ Đã lưu cấu hình thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('❌ Lỗi khi lưu cấu hình: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setConfig({ ...config, [field]: value });
  };

  if (loading) {
    return <div className="loading">Đang tải cấu hình...</div>;
  }

  return (
    <div className="system-config">
      <h2>Quản lý cấu hình hệ thống</h2>
      
      <div className="config-sections">
        {/* General Settings */}
        <div className="config-section">
          <h3>🔧 Cài đặt chung</h3>
          <div className="config-group">
            <label>Tên hệ thống:</label>
            <input
              type="text"
              value={config.systemName}
              onChange={(e) => handleInputChange('systemName', e.target.value)}
            />
          </div>
          
          <div className="config-group">
            <label>Số thiết bị tối đa mỗi user:</label>
            <input
              type="number"
              value={config.maxDevicesPerUser}
              onChange={(e) => handleInputChange('maxDevicesPerUser', Number(e.target.value))}
            />
          </div>
          
          <div className="config-group">
            <label>Thời gian lưu log (ngày):</label>
            <input
              type="number"
              value={config.logRetentionDays}
              onChange={(e) => handleInputChange('logRetentionDays', Number(e.target.value))}
            />
          </div>
          
          <div className="config-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
              />
              Chế độ bảo trì (Maintenance Mode)
            </label>
          </div>
        </div>

        {/* MQTT Settings */}
        <div className="config-section">
          <h3>📡 Cấu hình MQTT</h3>
          <div className="config-group">
            <label>MQTT Broker URL:</label>
            <input
              type="text"
              value={config.mqttBroker}
              onChange={(e) => handleInputChange('mqttBroker', e.target.value)}
            />
          </div>
          
          <div className="config-group">
            <label>MQTT Username:</label>
            <input
              type="text"
              value={config.mqttUsername}
              onChange={(e) => handleInputChange('mqttUsername', e.target.value)}
            />
          </div>
          
          <div className="config-note">
            ⚠️ Lưu ý: Thay đổi cấu hình MQTT có thể ảnh hưởng đến kết nối thiết bị
          </div>
        </div>

        {/* Default Device Settings */}
        <div className="config-section">
          <h3>⚙️ Cấu hình mặc định thiết bị</h3>
          
          <div className="config-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.defaultAutoMode}
                onChange={(e) => handleInputChange('defaultAutoMode', e.target.checked)}
              />
              Chế độ tự động mặc định
            </label>
          </div>
          
          <div className="config-group">
            <label>Đóng khi độ ẩm ≥ (%):</label>
            <input
              type="range"
              min="50"
              max="95"
              value={config.defaultRhHigh}
              onChange={(e) => handleInputChange('defaultRhHigh', Number(e.target.value))}
            />
            <span className="range-value">{config.defaultRhHigh}%</span>
          </div>
          
          <div className="config-group">
            <label>Mở khi ánh sáng &gt; (lux):</label>
            <input
              type="range"
              min="1000"
              max="40000"
              step="1000"
              value={config.defaultLuxOpen}
              onChange={(e) => handleInputChange('defaultLuxOpen', Number(e.target.value))}
            />
            <span className="range-value">{config.defaultLuxOpen} lux</span>
          </div>
          
          <div className="config-group">
            <label>Đóng khi ánh sáng &lt; (lux):</label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={config.defaultLuxClose}
              onChange={(e) => handleInputChange('defaultLuxClose', Number(e.target.value))}
            />
            <span className="range-value">{config.defaultLuxClose} lux</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`config-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="config-actions">
        <button onClick={handleSave} disabled={saving} className="btn-save">
          {saving ? 'Đang lưu...' : '💾 Lưu cấu hình'}
        </button>
        <button onClick={fetchConfig} className="btn-reset">
          🔄 Tải lại
        </button>
      </div>
    </div>
  );
};

export default SystemConfig;
