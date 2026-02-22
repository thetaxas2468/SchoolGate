import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-circle c1" />
        <div className="login-bg-circle c2" />
      </div>
      <div className="login-card">
        <div className="login-brand">
          <span className="login-brand-icon">🏫</span>
          <h1>بوابة المدرسة</h1>
          <p>نظام إذن الخروج المبكر</p>
        </div>
        <form onSubmit={submit} className="login-form">
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input
              name="email"
              type="email"
              className="form-input"
              placeholder="بريدك الإلكتروني"
              value={form.email}
              onChange={handle}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handle}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
        <div className="login-demo">
          <h4>حسابات تجريبية</h4>
          <div className="demo-cred">
            <span>👑</span>
            <strong>المشرف:</strong>
            <span style={{cursor:'pointer',color:'var(--accent)'}} onClick={() => fillDemo('admin@school.com','admin123')}>admin@school.com / admin123</span>
          </div>
          <div className="demo-cred">
            <span>👩‍🏫</span>
            <strong>المعلم ١:</strong>
            <span style={{cursor:'pointer',color:'var(--accent)'}} onClick={() => fillDemo('sarah@school.com','teacher123')}>sarah@school.com / teacher123</span>
          </div>
          <div className="demo-cred">
            <span>👨‍🏫</span>
            <strong>المعلم ٢:</strong>
            <span style={{cursor:'pointer',color:'var(--accent)'}} onClick={() => fillDemo('michael@school.com','teacher123')}>michael@school.com / teacher123</span>
          </div>
        </div>
      </div>
    </div>
  );
}