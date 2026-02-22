import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, tabs }) {
  const { user, logout } = useAuth();

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?';

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span className="logo-icon">🏫</span>
        <h2>بوابة المدرسة</h2>
        <span>نظام الخروج المبكر</span>
      </div>
      <div className="sidebar-nav">
        <div className="nav-section-label">التنقل</div>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <span>🚪</span> تسجيل الخروج
        </button>
      </div>
    </div>
  );
}