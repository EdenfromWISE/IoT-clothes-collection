import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(user => user.id !== userId));
      alert('Đã xóa người dùng thành công');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Lỗi khi xóa người dùng');
    }
  };

  const toggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      alert(`Đã cập nhật quyền thành ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Lỗi khi cập nhật quyền');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Đang tải danh sách người dùng...</div>;
  }

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>Quản lý người dùng</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo email hoặc tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card">
          <h3>{users.length}</h3>
          <p>Tổng số người dùng</p>
        </div>
        <div className="stat-card">
          <h3>{users.filter(u => u.role === 'admin').length}</h3>
          <p>Quản trị viên</p>
        </div>
        <div className="stat-card">
          <h3>{users.filter(u => u.role !== 'admin').length}</h3>
          <p>Người dùng thường</p>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Tên hiển thị</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.email || 'N/A'}</td>
                <td>{user.displayName || 'Chưa đặt'}</td>
                <td>
                  <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>
                  {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'N/A'}
                </td>
                <td className="actions">
                  <button
                    onClick={() => toggleUserRole(user.id, user.role)}
                    className="btn-toggle-role"
                  >
                    {user.role === 'admin' ? 'Hạ quyền' : 'Lên Admin'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="btn-delete"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="no-data">Không tìm thấy người dùng nào</div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
