# IoT Clothes Collector - Source Code

## 💻 Mã nguồn dự án

Thư mục này chứa toàn bộ source code của hệ thống IoT thu gom quần áo.

## 📁 Cấu trúc Source Code:

```
Source code/
├── Backend/            # Node.js API Server
│   ├── config/         # Database & MQTT config
│   ├── src/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Routes/
│   │   ├── Middlewares/
│   │   ├── Services/
│   │   └── app.js
│   ├── package.json
│   └── .env
├── Frontend/           # Web Dashboard (coming soon)
├── Mobile/             # Mobile App (coming soon)
└── Hardware/           # ESP32 Arduino Code (coming soon)
```

## 🚀 Hướng dẫn chạy Backend:

### Yêu cầu:
- Node.js >= 14.x
- MongoDB Atlas account
- Mosquitto MQTT broker (optional)

### Cài đặt:
```bash
cd "Source code/Backend"
npm install
```

### Cấu hình:
Sao chép `.env.example` thành `.env` và cập nhật:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
MQTT_HOST=localhost
PORT=3000
```

### Chạy:
```bash
# Development
npm run dev

# Production
npm start
```

## 🔗 API Endpoints:

- `POST /api/auth/login` - Đăng nhập
- `GET /api/devices` - Lấy danh sách thiết bị
- `POST /api/sensors/data` - Nhận dữ liệu từ ESP32
- `POST /api/commands/:deviceId/send` - Gửi lệnh điều khiển

## 📱 Mobile App & Frontend:

Sẽ được phát triển trong các giai đoạn tiếp theo.

## 🔧 Hardware (ESP32):

Code Arduino cho ESP32 sẽ được thêm vào thư mục `Hardware/`.