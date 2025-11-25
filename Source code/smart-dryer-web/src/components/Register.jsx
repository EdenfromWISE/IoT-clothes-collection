import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Việc chuyển hướng sẽ được xử lý bởi App.jsx
    } catch (err) {
      setError('Đăng ký thất bại. Vui lòng thử lại.');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleRegister} className="auth-form">
      <h2>Đăng ký</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mật khẩu (ít nhất 6 ký tự)"
        required
      />
      {error && <p className="error-message">{error}</p>}
      <button type="submit">Đăng ký</button>
    </form>
  );
};

export default Register;