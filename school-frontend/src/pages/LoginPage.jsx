import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('مرحباً بعودتك!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
    toast('تم ملء البيانات — اضغط تسجيل الدخول', { icon: '✨' });
  };

  const DEMO_ACCOUNTS = [
    { icon: '👑', label: 'المشرف', email: 'admin@school.com', password: 'admin123', color: '#a78bfa' },
    { icon: '👩‍🏫', label: 'المعلمة سارة', email: 'sarah@school.com', password: 'teacher123', color: '#f472b6' },
    { icon: '👨‍🏫', label: 'المعلم مايكل', email: 'michael@school.com', password: 'teacher123', color: '#34d399' },
  ];

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-circle c1" />
        <div className="login-bg-circle c2" />
        <div className="login-bg-circle c3" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">🏫</div>
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
              placeholder="name@school.com"
              value={form.email}
              onChange={handle}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handle}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text3)', fontSize: 16, padding: '4px',
                  display: 'flex', alignItems: 'center', transition: 'color 0.15s',
                }}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.7s linear infinite',
                }} />
                جاري تسجيل الدخول...
              </>
            ) : (
              <><span>🔐</span> تسجيل الدخول</>
            )}
          </button>
        </form>

        <div className="login-demo">
          <h4>حسابات تجريبية — انقر للملء</h4>
          {DEMO_ACCOUNTS.map(acc => (
            <div
              key={acc.email}
              className="demo-cred"
              onClick={() => fillDemo(acc.email, acc.password)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && fillDemo(acc.email, acc.password)}
            >
              <span style={{
                width: 28, height: 28,
                background: `${acc.color}22`, border: `1px solid ${acc.color}44`,
                borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, flexShrink: 0,
              }}>
                {acc.icon}
              </span>
              <strong>{acc.label}</strong>
              <span className="cred-value" style={{ marginLeft: 'auto', fontSize: 11 }}>
                {acc.email}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}