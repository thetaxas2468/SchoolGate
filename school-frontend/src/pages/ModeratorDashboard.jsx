import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TABS = [
  { id: 'overview', icon: '📊', label: 'نظرة عامة' },
  { id: 'classes', icon: '🏫', label: 'الفصول' },
  { id: 'students', icon: '👥', label: 'الطلاب' },
  { id: 'teachers', icon: '👩‍🏫', label: 'المعلمون' },
  { id: 'messages', icon: '📋', label: 'كل الأذونات' },
];

export default function ModeratorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [messages, setMessages] = useState([]);

  const load = useCallback(async () => {
    try {
      const [cls, stu, tea, msg] = await Promise.all([
        API.get('/classes'),
        API.get('/students'),
        API.get('/users/teachers'),
        API.get('/messages'),
      ]);
      setClasses(cls.data);
      setStudents(stu.data);
      setTeachers(tea.data);
      setMessages(msg.data);
    } catch { toast.error('فشل تحميل البيانات'); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabTitles = {
    overview: { title: 'لوحة المشرف', sub: 'نظرة عامة وإحصائيات النظام' },
    classes: { title: 'إدارة الفصول', sub: 'إنشاء الفصول وتعيين المعلمين والطلاب' },
    students: { title: 'إدارة الطلاب', sub: 'إضافة وإدارة جميع الطلاب' },
    teachers: { title: 'إدارة المعلمين', sub: 'إدارة حسابات المعلمين' },
    messages: { title: 'كل الأذونات', sub: 'عرض وإدارة جميع طلبات الخروج' },
  };

  const content = {
    overview: () => <OverviewTab classes={classes} students={students} teachers={teachers} messages={messages} />,
    classes: () => <ClassesTab classes={classes} students={students} teachers={teachers} reload={load} />,
    students: () => <StudentsTab students={students} classes={classes} reload={load} />,
    teachers: () => <TeachersTab teachers={teachers} reload={load} />,
    messages: () => <MessagesTab messages={messages} reload={load} />,
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

// ─── OVERVIEW ───
function OverviewTab({ classes, students, teachers, messages }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayMsgs = messages.filter(m => m.date === today);

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card accent1">
          <span className="stat-icon">🏫</span>
          <div className="stat-value">{classes.length}</div>
          <div className="stat-label">الفصول</div>
        </div>
        <div className="stat-card accent3">
          <span className="stat-icon">👥</span>
          <div className="stat-value">{students.length}</div>
          <div className="stat-label">الطلاب</div>
        </div>
        <div className="stat-card accent2">
          <span className="stat-icon">👩‍🏫</span>
          <div className="stat-value">{teachers.length}</div>
          <div className="stat-label">المعلمون</div>
        </div>
        <div className="stat-card accent4">
          <span className="stat-icon">📋</span>
          <div className="stat-value">{messages.length}</div>
          <div className="stat-label">إجمالي الأذونات</div>
        </div>
      </div>

      {todayMsgs.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3>📅 اذونات اليوم</h3>
            <span className="badge badge-class">{todayMsgs.length} إذن</span>
          </div>
          <div style={{ padding: '12px 20px' }}>
            {todayMsgs.map(m => <MsgCard key={m._id} message={m} showTeacher />)}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>📋 أذونات حديثة</h3>
          <span className="badge badge-teacher">{messages.length} إجمالي</span>
        </div>
        <div style={{ padding: '12px 20px' }}>
          {messages.slice(0, 8).map(m => <MsgCard key={m._id} message={m} showTeacher />)}
          {messages.length === 0 && (
            <div className="empty-state">
              <span className="empty-state-icon">📭</span>
              <p>لا توجد رسائل بعد.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CLASSES ───
function ClassesTab({ classes, students, teachers, reload }) {
  const [newClassName, setNewClassName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const createClass = async e => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      await API.post('/classes', { name: newClassName.trim() });
      setNewClassName('');
      toast.success('تم إنشاء الفصل!');
      reload();
    } catch { toast.error('فشل إنشاء الفصل'); }
  };

  const deleteClass = async id => {
    try {
      await API.delete(`/classes/${id}`);
      toast.success('تم حذف الفصل');
      setDeleteConfirm(null);
      reload();
    } catch { toast.error('فشل الحذف'); }
  };

  const assignTeacher = async (classId, teacherId) => {
    try {
      await API.put(`/classes/${classId}/teacher`, { teacherId: teacherId || null });
      toast.success('تم تعيين المعلم!');
      reload();
    } catch { toast.error('فشل تعيين المعلم'); }
  };

  const addStudentToClass = async (classId, studentId) => {
    if (!studentId) return;
    try {
      await API.post(`/classes/${classId}/students`, { studentId });
      toast.success('تمت إضافة الطالب!');
      reload();
    } catch { toast.error('فشل إضافة الطالب'); }
  };

  const removeStudentFromClass = async (classId, studentId) => {
    try {
      await API.delete(`/classes/${classId}/students/${studentId}`);
      toast.success('تم حذف الطالب من الفصل');
      reload();
    } catch { toast.error('فشل الحذف'); }
  };

  const unassignedStudents = students.filter(s => !s.classId);

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, maxWidth: 500 }}>
        <div className="card-header"><h3>➕ إنشاء فصل جديد</h3></div>
        <div className="card-body">
          <form onSubmit={createClass} style={{ display: 'flex', gap: 12 }}>
            <input
              className="form-input"
              placeholder="اسم الفصل (مثال: ١٠-أ)"
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>إنشاء</button>
          </form>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🏫</span>
          <p>لا توجد فصول بعد. أنشئ فصلاً أعلاه.</p>
        </div>
      ) : (
        <div className="grid-2">
          {classes.map(cls => (
            <div key={cls._id} className="class-card">
              <div className="class-card-header">
                <h4>🏫 {cls.name}</h4>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(cls._id)}>🗑️</button>
              </div>

              {deleteConfirm === cls._id && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div className="confirm-box">
                    <span className="confirm-text">هل تريد حذف هذا الفصل؟</span>
                    <div className="confirm-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>لا</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteClass(cls._id)}>نعم</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="class-card-body">
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">المعلم المعين</label>
                  <select
                    className="form-select"
                    value={cls.teacherId?._id || ''}
                    onChange={e => assignTeacher(cls._id, e.target.value)}
                  >
                    <option value="">— لا يوجد معلم —</option>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label">إضافة طالب</label>
                  <select
                    className="form-select"
                    value=""
                    onChange={e => { if (e.target.value) addStudentToClass(cls._id, e.target.value); }}
                  >
                    <option value="">— اختر طالباً —</option>
                    {unassignedStudents.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <div className="form-label" style={{ marginBottom: 8 }}>
                    الطلاب ({cls.students?.length || 0})
                  </div>
                  {!cls.students?.length && (
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>لا يوجد طلاب بعد</span>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {cls.students?.map(s => (
                      <div key={s._id} className="student-chip">
                        👤 {s.name}
                        <button
                          className="remove-btn"
                          onClick={() => removeStudentFromClass(cls._id, s._id)}
                          title="إزالة"
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STUDENTS ───
function StudentsTab({ students, classes, reload }) {
  const [name, setName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');

  const create = async e => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await API.post('/students', { name: name.trim() });
      setName('');
      toast.success('تمت إضافة الطالب!');
      reload();
    } catch { toast.error('فشل الإضافة'); }
  };

  const del = async id => {
    try {
      await API.delete(`/students/${id}`);
      toast.success('تم حذف الطالب');
      setDeleteConfirm(null);
      reload();
    } catch { toast.error('فشل الحذف'); }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, maxWidth: 500 }}>
        <div className="card-header"><h3>➕ إضافة طالب جديد</h3></div>
        <div className="card-body">
          <form onSubmit={create} style={{ display: 'flex', gap: 12 }}>
            <input
              className="form-input"
              placeholder="اسم الطالب بالكامل"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>إضافة</button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>كل الطلاب ({students.length})</h3>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="البحث..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">👤</span>
              <p>لا يوجد طلاب.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>#</th><th>الاسم</th><th>الفصل</th><th>الإجراءات</th></tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s._id}>
                    <td style={{ color: 'var(--text3)', width: 40 }}>{i + 1}</td>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>{s.name}</td>
                    <td>
                      {s.classId
                        ? <span className="badge badge-class">{s.classId.name}</span>
                        : <span style={{ color: 'var(--text3)', fontSize: 12 }}>غير معين</span>}
                    </td>
                    <td>
                      {deleteConfirm === s._id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--text3)' }}>متأكد؟</span>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>لا</button>
                          <button className="btn btn-danger btn-sm" onClick={() => del(s._id)}>نعم</button>
                        </div>
                      ) : (
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(s._id)}>🗑️ حذف</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TEACHERS ───
function TeachersTab({ teachers, reload }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const create = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post('/users/teachers', form);
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
      toast.success('تم إنشاء حساب المعلم!');
      reload();
    } catch (err) { toast.error(err.response?.data?.message || 'فشل'); }
    finally { setSubmitting(false); }
  };

  const del = async id => {
    try {
      await API.delete(`/users/teachers/${id}`);
      toast.success('تم حذف المعلم');
      setDeleteConfirm(null);
      reload();
    } catch { toast.error('فشل الحذف'); }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ إلغاء' : '➕ إضافة معلم جديد'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 500 }}>
          <div className="card-header"><h3>👩‍🏫 حساب معلم جديد</h3></div>
          <div className="card-body">
            <form onSubmit={create} className="form-grid">
              <div className="form-group">
                <label className="form-label">الاسم الكامل</label>
                <input className="form-input" name="name" placeholder="اسم المعلم" value={form.name} onChange={handle} required />
              </div>
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني</label>
                <input className="form-input" name="email" type="email" placeholder="teacher@school.com" value={form.email} onChange={handle} required />
              </div>
              <div className="form-group">
                <label className="form-label">كلمة المرور</label>
                <input className="form-input" name="password" type="password" placeholder="كلمة المرور" value={form.password} onChange={handle} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'جاري الإنشاء...' : '✅ إنشاء الحساب'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>جميع المعلمين</h3>
          <span className="badge badge-teacher">{teachers.length} معلم</span>
        </div>
        <div className="table-wrap">
          {teachers.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">👩‍🏫</span>
              <p>لا يوجد معلمون بعد.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>#</th><th>الاسم</th><th>البريد الإلكتروني</th><th>الفصل</th><th>الإجراءات</th></tr>
              </thead>
              <tbody>
                {teachers.map((t, i) => (
                  <tr key={t._id}>
                    <td style={{ color: 'var(--text3)', width: 40 }}>{i + 1}</td>
                    <td style={{ color: 'var(--text)', fontWeight: 600 }}>{t.name}</td>
                    <td style={{ color: 'var(--text3)' }}>{t.email}</td>
                    <td>
                      {t.assignedClassId
                        ? <span className="badge badge-class">{t.assignedClassId.name}</span>
                        : <span style={{ color: 'var(--text3)', fontSize: 12 }}>غير معين</span>}
                    </td>
                    <td>
                      {deleteConfirm === t._id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--text3)' }}>متأكد؟</span>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>لا</button>
                          <button className="btn btn-danger btn-sm" onClick={() => del(t._id)}>نعم</button>
                        </div>
                      ) : (
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(t._id)}>🗑️ حذف</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGES ───
function MessagesTab({ messages, reload }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');

  const del = async id => {
    try {
      await API.delete(`/messages/${id}`);
      toast.success('تم حذف الإذن');
      setDeleteConfirm(null);
      reload();
    } catch { toast.error('فشل الحذف'); }
  };

  const filtered = messages.filter(m =>
    m.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.teacherId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.classId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-header">
        <h3>جميع أذونات الخروج</h3>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="البحث..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div style={{ padding: '12px 20px' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <p>لا توجد رسائل.</p>
          </div>
        ) : (
          filtered.map(m => (
            <div key={m._id}>
              {deleteConfirm === m._id && (
                <div style={{ marginBottom: 8 }}>
                  <div className="confirm-box">
                    <span className="confirm-text">هل تريد حذف هذا الإذن؟</span>
                    <div className="confirm-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>لا</button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(m._id)}>نعم، احذف</button>
                    </div>
                  </div>
                </div>
              )}
              <MsgCard message={m} showTeacher onDelete={() => setDeleteConfirm(m._id)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── SHARED MESSAGE CARD ───
function MsgCard({ message: m, showTeacher, onDelete }) {
  const formatTime = time => {
    try {
      const [h, min] = time.split(':');
      const d = new Date(); d.setHours(+h, +min);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return time; }
  };

  return (
    <div className="message-card">
      <div className="message-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="message-student">👤 {m.studentId?.name || 'Unknown'}</div>
          <div className="message-meta">
            <span className="badge badge-class">{m.classId?.name}</span>
            {showTeacher && <span className="badge badge-teacher">👩‍🏫 {m.teacherId?.name}</span>}
            <span className="message-info">📅 {new Date(m.date).toLocaleDateString('ar-EG')}</span>
            <span className="message-info">🕐 {formatTime(m.time)}</span>
          </div>
          {m.reason && <div className="message-reason">{m.reason}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <div className="message-time">
            {new Date(m.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
          </div>
          {onDelete && (
            <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑️</button>
          )}
        </div>
      </div>
    </div>
  );
}