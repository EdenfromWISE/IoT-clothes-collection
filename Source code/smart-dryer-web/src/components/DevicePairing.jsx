import { useState } from 'react';

const DevicePairing = ({ onDevicePaired }) => {
  const [deviceId, setDeviceId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Gọi callback để lưu deviceId, loại bỏ khoảng trắng thừa
    if (deviceId.trim()) {
      onDevicePaired(deviceId.trim().toUpperCase());
    }
  };

  return (
    <div className="pairing-container">
      <h2>Ghép đôi thiết bị</h2>
      <p>Vui lòng nhập Device ID từ ứng dụng di động của bạn và dán vào đây.</p>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="VD: AABBCCDDEEFF"
          required
        />
        <button type="submit">Lưu và kết nối</button>
      </form>
    </div>
  );
};

export default DevicePairing;