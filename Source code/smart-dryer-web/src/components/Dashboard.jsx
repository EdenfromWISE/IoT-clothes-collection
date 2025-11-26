import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import DevicePairing from './DevicePairing';
import DeviceControl from './DeviceControl';
import Sidebar from './Sidebar';
import LogHistory from './LogHistory';
import SetupAdmin from './SetupAdmin';

const Dashboard = ({ user }) => {
  const [deviceId, setDeviceId] = useState(null);
  const [activeTab, setActiveTab] = useState('control');
  const [showAdminSetup, setShowAdminSetup] = useState(false);

  // Khi component được tải, kiểm tra xem có deviceId nào được lưu không
  useEffect(() => {
    const savedDeviceId = localStorage.getItem('paired_device_id');
    if (savedDeviceId) {
      setDeviceId(savedDeviceId);
    }
  }, []);

  const handleDevicePaired = (id) => {
    localStorage.setItem('paired_device_id', id);
    setDeviceId(id);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('paired_device_id');
    setDeviceId(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Xóa luôn deviceId khi đăng xuất
      localStorage.removeItem('paired_device_id');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <div className="dashboard-container">
      {deviceId ? (
        <div className="main-layout">
          <Sidebar activeTab={activeTab} onTabClick={setActiveTab} />
          <div className="main-content">
            <div className="dashboard-header">
              <h1>{activeTab === 'control' ? 'Bảng điều khiển' : 'Lịch sử'}</h1>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setShowAdminSetup(true)}
                  style={{ background: '#f39c12', color: 'white', border: '1px solid #f39c12' }}
                >
                  🛠️ Setup Admin
                </button>
                <button onClick={handleSignOut}>Đăng xuất</button>
              </div>
            </div>
            {activeTab === 'control' && <DeviceControl deviceId={deviceId} onDisconnect={handleDisconnect} />}
            {activeTab === 'history' && <LogHistory deviceId={deviceId} />}
          </div>
        </div>
      ) : (
        // Giao diện ghép đôi vẫn giữ nguyên
        <div className="pairing-wrapper">
          <DevicePairing onDevicePaired={handleDevicePaired} />
          <button 
            onClick={() => setShowAdminSetup(true)}
            style={{ 
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🛠️ Setup Admin
          </button>
        </div>
      )}
      
      {showAdminSetup && <SetupAdmin onClose={() => setShowAdminSetup(false)} />}
    </div>
  );
};

export default Dashboard;