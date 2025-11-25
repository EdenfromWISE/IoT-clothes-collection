import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css'

function App() {
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(true); // Thêm trạng thái loading

  useEffect(() => {
    // onAuthStateChanged trả về một hàm để hủy đăng ký lắng nghe
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Dừng loading khi đã có thông tin user
    });

    // Dọn dẹp subscription khi component bị unmount
    return () => unsubscribe();
  }, []);

  // Hiển thị màn hình loading trong khi chờ Firebase kiểm tra
  if (loading) {
    return <div>Đang tải...</div>;
  }

  // Nếu đã có user, hiển thị Dashboard
  return (
    <div className="app-container">
      {user ? (
        <Dashboard user={user} />
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
