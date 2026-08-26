import React, { useState } from 'react';
import { register } from '../services/authService';

const RegisterForm = ({ onRegister, switchToLogin }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await register(form.name, form.email, form.password);
      onRegister(data.user);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="auth-subtitle">Create an account</h2>
      <p className="auth-desc">Start tracking your job applications today</p>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-name">Name (optional)</label>
          <input
            id="reg-name"
            className="form-input"
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={set('name')}
            autoComplete="name"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
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
          <label className="form-label" htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            className="form-input"
            type="password"
            placeholder="Min 6 characters"
            value={form.password}
            onChange={set('password')}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-confirm">Confirm password</label>
          <input
            id="reg-confirm"
            className="form-input"
            type="password"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            required
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginTop: 8 }}
          disabled={loading}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="auth-switch">
        Already have an account?
        <button onClick={switchToLogin}>Sign in</button>
      </div>
    </>
  );
};

export default RegisterForm;
