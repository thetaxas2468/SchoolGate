import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TABS = [
  { id: 'overview', icon: '📊', label: 'نظرة عامة' },
  { id: 'students', icon: '👥', label: 'طلابي' },
  { id: 'new-message', icon: '✉️', label: 'إذن جديد' },
  { id: 'messages', icon: '📋', label: 'رسائلي' },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [myClass, setMyClass] = useState(null);
  const [form, setForm] = useState({
    studentId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [studRes, msgRes, classRes] = await Promise.all([
        API.get('/students'),
        API.get('/messages'),
        API.get('/classes'),
      ]);
      setStudents(studRes.data);
      setMessages(msgRes.data);
      setMyClass(classRes.data[0] || null);
    } catch { toast.error('فشل تحميل البيانات'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitMessage = async e => {
    e.preventDefault();
    if (!form.studentId || !form.date || !form.time) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setSubmitting(true);
    try {
      await API.post('/messages', form);
      toast.success('تم إرسال الإذن!');
      setForm({ studentId: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', reason: '' });
      setActiveTab('messages');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الإرسال');
    } finally { setSubmitting(false); }
  };

  const todayCount = messages.filter(m => m.date === format(new Date(), 'yyyy-MM-dd')).length;
  const selectedStudent = students.find(s => s._id === form.studentId);

  const renderOverview = () => (
    <div>
      <div className="stats-grid">
        <div className="stat-card accent1">
          <span className="stat-icon">🏫</span>
          <div className="stat-value" style={{ fontSize: myClass?.name?.length > 6 ? 20 : 30 }}>
            {myClass?.name || '—'}
          </div>
          <div className="stat-label">فصلي</div>
        </div>
        <div className="stat-card accent3">
          <span className="stat-icon">👥</span>
          <div className="stat-value">{students.length}</div>
          <div className="stat-label">الطلاب</div>
        </div>
        <div className="stat-card accent2">
          <span className="stat-icon">📋</span>
          <div className="stat-value">{messages.length}</div>
          <div className="stat-label">الأذونات المرسلة</div>
        </div>
        <div className="stat-card accent4">
          <span className="stat-icon">📅</span>
          <div className="stat-value">{todayCount}</div>
          <div className="stat-label">خروج اليوم</div>
        </div>
      </div>

      {/* Quick action */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,109,250,0.12), rgba(167,139,250,0.06))',
        border: '1px solid rgba(124,109,250,0.2)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            إرسال إذن خروج جديد
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            اختر الطالب والوقت وأرسل الإذن
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveTab('new-message')}>
          ✉️ إذن جديد
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>أذونات حديثة</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('messages')}>
            عرض الكل
          </button>
        </div>
        <div style={{ padding: '12px 20px' }}>
          {messages.slice(0, 5).length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📭</span>
              <p>لا توجد أذونات حديثة.</p>
            </div>
          ) : (
            messages.slice(0, 5).map(m => <MessageCard key={m._id} message={m} />)
          )}
        </div>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="card">
      <div className="card-header">
        <h3>👥 طلابي</h3>
        {myClass && <span className="badge badge-class">{myClass.name}</span>}
      </div>
      <div className="table-wrap">
        {students.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">👤</span>
            <p>لا يوجد طلاب مسجّلون في فصلك بعد.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>#</th><th>الاسم</th><th>الفصل</th><th>الإجراءات</th></tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s._id}>
                  <td style={{ color: 'var(--text3)', width: 40 }}>{i + 1}</td>
                  <td style={{ color: 'var(--text)', fontWeight: 600 }}>{s.name}</td>
                  <td><span className="badge badge-class">{s.classId?.name || 'غير معين'}</span></td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setForm(f => ({ ...f, studentId: s._id }));
                        setActiveTab('new-message');
                      }}
                    >
                      ✉️ إذن خروج
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderNewMessage = () => (
    <div className="card" style={{ maxWidth: 580 }}>
      <div className="card-header">
        <h3>✉️ إرسال إذن خروج جديد</h3>
      </div>
      <div className="card-body">
        <form onSubmit={submitMessage} className="form-grid">
          <div className="form-group">
            <label className="form-label">الطالب <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select
              className="form-select"
              value={form.studentId}
              onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
              required
            >
              <option value="">اختر طالباً...</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>

          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">التاريخ <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">وقت الخروج <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="time"
                className="form-input"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">السبب (اختياري)</label>
            <textarea
              className="form-textarea"
              placeholder="مثال: مريض. طلب من الأهل..."
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            />
          </div>

          {/* Preview */}
          {selectedStudent && form.date && form.time && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(124,109,250,0.08), rgba(167,139,250,0.04))',
              border: '1px solid rgba(124,109,250,0.2)',
              borderRadius: 12,
              padding: '14px 16px',
              fontSize: 13,
              color: 'var(--text2)',
              lineHeight: 1.6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span>👁️</span>
                <strong style={{ color: 'var(--accent)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                  معاينة
                </strong>
              </div>
              <span style={{ color: 'var(--text)' }}>{selectedStudent.name}</span>
              {' '}سيخرج من المدرسة في{' '}
              <span style={{ color: 'var(--text)' }}>{new Date(form.date).toLocaleDateString('ar-EG')}</span>
              {' '}الساعة{' '}
              <span style={{ color: 'var(--text)' }}>{form.time}</span>
              {form.reason && <><br /><span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>السبب: {form.reason}</span></>}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
            {submitting ? (
              <>
                <span style={{
                  width: 16, height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  display: 'inline-block', animation: 'spin 0.7s linear infinite',
                }} />
                جاري الإرسال...
              </>
            ) : (
              <><span>📤</span> إرسال الإذن</>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="card">
      <div className="card-header">
        <h3>📋 تاريخ الأذونات</h3>
        <span className="badge badge-teacher">{messages.length} إجمالي</span>
      </div>
      <div style={{ padding: '12px 20px' }}>
        {messages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <p>لم يتم إرسال أي أذونات بعد.</p>
          </div>
        ) : (
          messages.map(m => <MessageCard key={m._id} message={m} />)
        )}
      </div>
    </div>
  );

  const content = {
    overview: renderOverview,
    students: renderStudents,
    'new-message': renderNewMessage,
    messages: renderMessages,
  };

  const tabTitles = {
    overview: { title: 'لوحة المعلم', sub: `مرحباً بعودتك، ${user?.name}` },
    students: { title: 'طلابي', sub: `طلاب ${myClass?.name || 'فصلك'}` },
    'new-message': { title: 'إذن خروج جديد', sub: 'إرسال طلب إذن خروج مبكر' },
    messages: { title: 'تاريخ الأذونات', sub: 'جميع الأذونات التي قمت بإرسالها' },
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
      <div className="main-content">
        <div className="content-header">
          <h1>{tabTitles[activeTab]?.title}</h1>
          <p className="header-sub">{tabTitles[activeTab]?.sub}</p>
          <div className="tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="content-body">
          {content[activeTab]?.()}
        </div>
      </div>
    </div>
  );
}

function MessageCard({ message }) {
  const formatTime = time => {
    try {
      const [h, m] = time.split(':');
      const d = new Date(); d.setHours(+h, +m);
      return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    } catch { return time; }
  };

  return (
    <div className="message-card">
      <div className="message-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="message-student">👤 {message.studentId?.name || 'Unknown'}</div>
          <div className="message-meta">
            <span className="badge badge-class">{message.classId?.name}</span>
            <span className="message-info">
              📅 {new Date(message.date).toLocaleDateString('ar-EG', {
                weekday: 'short', month: 'short', day: 'numeric'
              })}
            </span>
            <span className="message-info">🕐 {formatTime(message.time)}</span>
          </div>
          {message.reason && <div className="message-reason">{message.reason}</div>}
        </div>
        <div className="message-time" style={{ flexShrink: 0 }}>
          {new Date(message.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
        </div>
      </div>
    </div>
  );
}