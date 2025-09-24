const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/Users'); // Điều chỉnh path theo Users.js của bạn

class AuthController {
  // Đăng ký người dùng mới
  async register(req, res) {
    try {
      const { username, email, password, fullName } = req.body;

      // Kiểm tra input
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email và password là bắt buộc'
        });
      }

      // Kiểm tra email đã tồn tại
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email hoặc username đã được sử dụng'
        });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Tạo user mới
      const newUser = new User({
        username,
        email,
        passwordHash, // Sử dụng passwordHash thay vì password
        fullName: fullName || username,
        role: 'user', // Mặc định là user
        isActive: true
      });

      await newUser.save();

      // Tạo JWT token
      const token = jwt.sign(
        { 
          userId: newUser._id, 
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: {
          user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role
          },
          token
        }
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng ký',
        error: error.message
      });
    }
  }

  // Đăng nhập
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Kiểm tra input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username và password là bắt buộc'
        });
      }

      // Tìm user (có thể là username hoặc email) và kiểm tra isActive
      const user = await User.findOne({
        $or: [{ username }, { email: username }],
        isActive: true // Chỉ cho phép user active đăng nhập
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Thông tin đăng nhập không chính xác hoặc tài khoản đã bị khóa'
        });
      }

      // Kiểm tra password với passwordHash
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Thông tin đăng nhập không chính xác'
        });
      }

      // Tạo JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          username: user.username,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role
          },
          token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng nhập',
        error: error.message
      });
    }
  }

  // Lấy thông tin người dùng hiện tại
  async getCurrentUser(req, res) {
    try {
      // req.user được set từ middleware xác thực
      const user = await User.findById(req.user.userId).select('-passwordHash');
      
      if (!user || !user.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng hoặc tài khoản đã bị khóa'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });

    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin người dùng',
        error: error.message
      });
    }
  }

  // Đổi mật khẩu
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc'
        });
      }

      const user = await User.findById(req.user.userId);

      // Kiểm tra mật khẩu hiện tại với passwordHash
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu hiện tại không chính xác'
        });
      }

      // Hash mật khẩu mới
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Cập nhật passwordHash
      user.passwordHash = newPasswordHash;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đổi mật khẩu',
        error: error.message
      });
    }
  }

  // Đăng xuất
  async logout(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng xuất',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();