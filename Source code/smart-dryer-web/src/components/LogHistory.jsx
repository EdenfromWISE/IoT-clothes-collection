import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

// Helper để chuyển đổi log thành thông tin hiển thị
const getLogDisplayInfo = (log) => {
  const actionText = log.action === 'opened' ? 'Mở giàn phơi' : 'Đóng giàn phơi';
  const isOpening = log.action === 'opened';

  switch (log.trigger) {
    case 'manual':
      return { title: actionText, subtitle: 'Thao tác thủ công' };
    case 'rain_detected':
      return { title: 'Đóng giàn phơi', subtitle: 'Tự động do phát hiện mưa' };
    case 'humidity_high':
      return { title: 'Đóng giàn phơi', subtitle: 'Tự động do độ ẩm cao' };
    case 'light_threshold_open':
      return { title: 'Mở giàn phơi', subtitle: 'Tự động do trời nắng' };
    case 'light_threshold_close':
      return { title: 'Đóng giàn phơi', subtitle: 'Tự động do trời tối' };
    default:
      return { title: actionText, subtitle: 'Không rõ nguyên nhân' };
  }
};
const LogHistory = ({ deviceId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;

    setLoading(true);
    // Sửa lỗi: Truy vấn collection 'logs' ở cấp cao nhất
    const logsCollectionRef = collection(db, 'logs');
    // Thêm điều kiện 'where' để lọc theo deviceId
    const q = query(logsCollectionRef, 
                  where('deviceId', '==', deviceId), 
                  orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const logsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(logsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching logs: ', error);
        setLoading(false);
      }
    );

    // Dọn dẹp listener khi component unmount
    return () => unsubscribe();
  }, [deviceId]);

  if (loading) return <p>Đang tải lịch sử...</p>;

  if (logs.length === 0) {
    return <p>Chưa có lịch sử hoạt động nào.</p>;
  }

  return (
    <div className="log-history-container">
      <h2>Lịch sử hoạt động</h2>
      <ul className="log-list">
        {logs.map((log) => {
          const info = getLogDisplayInfo(log);
          const formattedTime = new Date(
            (log.timestamp instanceof Timestamp ? log.timestamp.toDate() : new Date(log.timestamp.seconds * 1000))
          ).toLocaleString('vi-VN', { hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });

          return (
            <li key={log.id} className="log-item">
              <div className="log-item-content">
                <span className="log-title">{info.title}</span>
                <span className="log-subtitle">{info.subtitle}</span>
              </div>
              <span className="log-timestamp">{formattedTime}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default LogHistory;