import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Việc chuyển hướng sẽ được xử lý bởi App.jsx
    } catch (err) {
      setError('Email hoặc mật khẩu không đúng.');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleLogin} className="auth-form">
      <h2>Đăng nhập</h2>
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
        placeholder="Mật khẩu"
        required
      />
      {error && <p className="error-message">{error}</p>}
      <button type="submit">Đăng nhập</button>
    </form>
  );
};

export default Login;