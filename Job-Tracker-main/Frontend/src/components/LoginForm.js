import React, { useState } from 'react';
import { login } from '../services/authService';

const LoginForm = ({ onLogin, switchToRegister }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="auth-subtitle">Welcome back</h2>
      <p className="auth-desc">Sign in to your CareerTrack account</p>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            required
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginTop: 8 }}
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="auth-switch">
        Don't have an account?
        <button onClick={switchToRegister}>Create one</button>
      </div>
    </>
  );
};

export default LoginForm;
