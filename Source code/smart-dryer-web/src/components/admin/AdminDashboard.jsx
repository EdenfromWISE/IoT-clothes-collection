import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import AdminSidebar from './AdminSidebar';
import Statistics from './Statistics';
import UserManagement from './UserManagement';
import DeviceManagement from './DeviceManagement';
import SystemLogs from './SystemLogs';
import SystemConfig from './SystemConfig';
import SystemPerformance from './SystemPerformance';
import FirmwareUpdate from './FirmwareUpdate';

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('statistics');

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'statistics':
        return <Statistics />;
      case 'users':
        return <UserManagement />;
      case 'devices':
        return <DeviceManagement />;
      case 'logs':
        return <SystemLogs />;
      case 'config':
        return <SystemConfig />;
      case 'performance':
        return <SystemPerformance />;
      case 'firmware':
        return <FirmwareUpdate />;
      default:
        return <Statistics />;
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar activeTab={activeTab} onTabClick={setActiveTab} />
      <div className="admin-main-content">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="admin-user-info">
            <span>{user.email}</span>
            <button onClick={handleSignOut} className="admin-logout-btn">
              Đăng xuất
            </button>
          </div>
        </div>
        <div className="admin-content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
