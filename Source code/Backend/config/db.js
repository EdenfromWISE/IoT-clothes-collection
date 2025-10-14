import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      // Kiểm tra xem đã kết nối chưa
      if (this.connection && mongoose.connection.readyState === 1) {
        console.log('MongoDB đã được kết nối trước đó');
        return this.connection;
      }

      // Cấu hình mongoose
      mongoose.set('strictQuery', false);

      // Kết nối MongoDB
      this.connection = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Giới hạn số connection pool
        serverSelectionTimeoutMS: 5000, // Timeout sau 5s
        socketTimeoutMS: 45000, // Đóng socket sau 45s không hoạt động
        family: 4 // Sử dụng IPv4
      });

      console.log(`✅ MongoDB Connected: ${this.connection.connection.host}`);
      
      // Log database name
      console.log(`📊 Database: ${this.connection.connection.name}`);

      // Xử lý các sự kiện
      this.handleEvents();

      return this.connection;

    } catch (error) {
      console.error('❌ MongoDB Connection Error:', error.message);
      
      // Retry connection sau 5 giây
      console.log('🔄 Thử kết nối lại sau 5 giây...');
      setTimeout(() => {
        this.connect();
      }, 5000);
      
      throw error;
    }
  }

  // Xử lý các sự kiện MongoDB
  handleEvents() {
    // Khi kết nối thành công
    mongoose.connection.on('connected', () => {
      console.log('🟢 Mongoose connected to MongoDB');
    });

    // Khi mất kết nối
    mongoose.connection.on('disconnected', () => {
      console.log('🔴 Mongoose disconnected from MongoDB');
    });

    // Khi có lỗi
    mongoose.connection.on('error', (error) => {
      console.error('💥 Mongoose connection error:', error);
    });

    // Khi ứng dụng bị terminate
    process.on('SIGINT', async () => {
      console.log('\n🛑 Đang đóng kết nối MongoDB...');
      await this.disconnect();
      process.exit(0);
    });

    // Khi process bị kill
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Đang đóng kết nối MongoDB...');
      await this.disconnect();
      process.exit(0);
    });
  }

  // Ngắt kết nối
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        this.connection = null;
      }
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error.message);
    }
  }

  // Kiểm tra trạng thái kết nối
  getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      status: states[mongoose.connection.readyState],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  // Thống kê database
  async getStats() {
    try {
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Database not connected');
      }

      const admin = mongoose.connection.db.admin();
      const stats = await admin.serverStatus();
      
      return {
        version: stats.version,
        uptime: stats.uptime,
        connections: stats.connections,
        network: stats.network,
        memory: stats.mem
      };
    } catch (error) {
      console.error('Error getting database stats:', error.message);
      return null;
    }
  }

  // Test kết nối
  async testConnection() {
    try {
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      console.error('Database ping failed:', error.message);
      return false;
    }
  }
}

// Tạo instance singleton
const database = new Database();

export default database;

// Export các hàm tiện ích
export const connectDB = () => database.connect();
export const disconnectDB = () => database.disconnect();
export const getDBStatus = () => database.getConnectionStatus();
export const getDBStats = () => database.getStats();
export const testDB = () => database.testConnection();