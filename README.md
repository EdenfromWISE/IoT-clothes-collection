# IoT Clothes Collector System

Hệ thống IoT thu gom quần áo tự động khi trời mưa sử dụng ESP32, Node.js Backend và Mobile App.

## 📋 Mô tả

Dự án IoT hoàn chỉnh bao gồm phần cứng ESP32 với cảm biến thời tiết, backend API và ứng dụng mobile để điều khiển và giám sát hệ thống thu gom quần áo tự động.

## 📁 Cấu trúc dự án

```
IoT-Clothes-Collection/
├── Documents/          # 📚 Tài liệu dự án
│   ├── README.md
│   ├── API-Documentation.md
│   ├── System-Design.md
│   └── Images/
└── Source code/        # 💻 Source code
    ├── Backend/        # Node.js API Server
    ├── Frontend/       # Web Dashboard (tương lai)
    ├── Mobile/         # Mobile App (tương lai)
    └── Hardware/       # ESP32 Code (tương lai)
```

## 🚀 Công nghệ sử dụng

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MQTT** - Giao thức giao tiếp với ESP32
- **MongoDB/MySQL/PostgreSQL** - Cơ sở dữ liệu (hỗ trợ đa dạng)
- **JWT** - Xác thực người dùng
- **bcryptjs** - Mã hóa mật khẩu

## 📁 Cấu trúc thư mục

```
Backend/
├── config/
│   ├── db.js          # Cấu hình database
│   └── mqtt.js        # Cấu hình MQTT
├── src/
│   ├── app.js         # Entry point
│   ├── Controllers/   # Xử lý logic
│   ├── Middlewares/   # Middleware functions
│   ├── Models/        # Database models
│   │   ├── Commands.js
│   │   ├── Devices.js
│   │   ├── Events.js
│   │   ├── Sensors.js
│   │   └── Users.js
│   ├── Routes/        # API routes
│   └── Services/      # Business logic
└── package.json
```

## ⚡ Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 14.x
- npm hoặc yarn

### Cài đặt dependencies

```bash
npm install
```

### Chạy ứng dụng

#### Development mode
```bash
npm run dev
```

#### Production mode
```bash
npm start
```

## 🔧 Cấu hình

Tạo file `.env` trong thư mục gốc với các biến môi trường cần thiết:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=iot_clothes_collector
DB_USER=your_username
DB_PASSWORD=your_password

# MQTT
MQTT_BROKER_URL=mqtt://your-mqtt-broker:1883
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Server
PORT=3000
NODE_ENV=development
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/logout` - Đăng xuất

### Devices
- `GET /api/devices` - Lấy danh sách thiết bị
- `POST /api/devices` - Thêm thiết bị mới
- `PUT /api/devices/:id` - Cập nhật thiết bị
- `DELETE /api/devices/:id` - Xóa thiết bị

### Sensors
- `GET /api/sensors` - Lấy dữ liệu cảm biến
- `POST /api/sensors` - Ghi dữ liệu cảm biến

### Commands
- `POST /api/commands` - Gửi lệnh đến thiết bị
- `GET /api/commands` - Lấy lịch sử lệnh

### Events
- `GET /api/events` - Lấy danh sách sự kiện
- `POST /api/events` - Tạo sự kiện mới

## 🔌 MQTT Topics

- `iot/sensors/data` - Nhận dữ liệu từ cảm biến
- `iot/commands/device` - Gửi lệnh đến thiết bị
- `iot/status/device` - Trạng thái thiết bị

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được cấp phép theo [MIT License](LICENSE).

## 👨‍💻 Tác giả

- **TH** - *Initial work*

## 🙏 Cảm ơn

- Cảm ơn cộng đồng Node.js và Express.js
- Cảm ơn các thư viện mã nguồn mở được sử dụng trong dự án