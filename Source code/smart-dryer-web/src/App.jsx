import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import './App.css'

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(true); // Thêm trạng thái loading

  useEffect(() => {
    // onAuthStateChanged trả về một hàm để hủy đăng ký lắng nghe
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Lấy role của user từ Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'user');
          } else {
            setUserRole('user'); // Mặc định là user nếu không tìm thấy
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user');
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false); // Dừng loading khi đã có thông tin user
    });

    // Dọn dẹp subscription khi component bị unmount
    return () => unsubscribe();
  }, []);

  // Hiển thị màn hình loading trong khi chờ Firebase kiểm tra
  if (loading) {
    return <div>Đang tải...</div>;
  }

  // Nếu đã có user, hiển thị Dashboard tương ứng với role
  return (
    <div className="app-container">
      {user ? (
        userRole === 'admin' ? (
          <AdminDashboard user={user} />
        ) : (
          <Dashboard user={user} />
        )
      ) : (
        <div className="auth-container">
          {isRegistering ? <Register /> : <Login />}
          <button className="toggle-button" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App
