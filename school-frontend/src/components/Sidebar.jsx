import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, tabs }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => { setOpen(false); }, [activeTab]);

  // Lock body scroll when sidebar open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const roleLabel = { moderator: 'مشرف', teacher: 'معلم', admin: 'مشرف' }[user?.role] || user?.role;

  const SidebarContent = () => (
    <>
      <div className="sidebar-brand">
        <div className="logo-wrap">
          <div className="logo-icon">🏫</div>
          <div className="sidebar-brand-text">
            <h2>بوابة المدرسة</h2>
            <span>نظام إذن الخروج</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`nav-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="nav-indicator" />
            <span className="nav-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{roleLabel}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <span>🚪</span>
          تسجيل الخروج
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button
          className="hamburger-btn"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <span style={{ transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ opacity: open ? 0 : 1 }} />
          <span style={{ transform: open ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>

        <div className="mobile-brand">
          <div className="logo-icon">🏫</div>
          <h2>بوابة المدرسة</h2>
        </div>

        <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
          {initials}
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${open ? 'open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <SidebarContent />
      </aside>
    </>
  );
}