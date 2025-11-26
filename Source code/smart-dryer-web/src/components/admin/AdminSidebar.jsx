const AdminSidebar = ({ activeTab, onTabClick }) => {
  const menuItems = [
    { id: 'statistics', icon: '📊', label: 'Thống kê' },
    { id: 'users', icon: '👥', label: 'Người dùng' },
    { id: 'devices', icon: '📱', label: 'Thiết bị' },
    { id: 'logs', icon: '📋', label: 'Nhật ký' },
    { id: 'config', icon: '⚙️', label: 'Cấu hình' },
    { id: 'performance', icon: '⚡', label: 'Hiệu năng' },
    { id: 'firmware', icon: '🔄', label: 'Cập nhật OTA' },
  ];

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2>🛠️ Admin Panel</h2>
      </div>
      <nav className="admin-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabClick(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
