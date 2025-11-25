const Sidebar = ({ activeTab, onTabClick }) => {
  return (
    <div className="sidebar">
      <button
        className={activeTab === 'control' ? 'active' : ''}
        onClick={() => onTabClick('control')}
      >
        Bảng điều khiển
      </button>
      <button
        className={activeTab === 'history' ? 'active' : ''}
        onClick={() => onTabClick('history')}
      >
        Lịch sử
      </button>
    </div>
  );
};

export default Sidebar;