import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const SetupAdmin = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const setCurrentUserAsAdmin = async () => {
    if (!auth.currentUser) {
      setMessage('Bạn cần đăng nhập trước!');
      return;
    }

    try {
      setLoading(true);
      const userId = auth.currentUser.uid;
      
      // Set role admin cho user hiện tại
      await setDoc(doc(db, 'users', userId), {
        uid: userId,
        email: auth.currentUser.email,
        role: 'admin',
        displayName: auth.currentUser.displayName || '',
        createdAt: new Date()
      }, { merge: true });

      setMessage('✅ Đã set role admin thành công! Vui lòng refresh trang.');
      
      // Tự động reload sau 2 giây
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error setting admin role:', error);
      setMessage('❌ Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Thiết lập Admin</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <p>Nhấn nút bên dưới để set tài khoản hiện tại thành Admin</p>
          <p style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
            Email: {auth.currentUser?.email}
          </p>
          
          <button 
            onClick={setCurrentUserAsAdmin}
            disabled={loading}
            style={{
              padding: '1rem 2rem',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              marginTop: '1rem'
            }}
          >
            {loading ? 'Đang xử lý...' : '🛠️ Set làm Admin'}
          </button>

          {message && (
            <p style={{ 
              marginTop: '1rem', 
              padding: '0.75rem',
              background: message.includes('✅') ? '#d4edda' : '#f8d7da',
              color: message.includes('✅') ? '#155724' : '#721c24',
              borderRadius: '6px'
            }}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupAdmin;
