import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '../../config/api';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';

export default function AdminDepartments() {
    const router = useRouter();
    const { user } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const [form, setForm] = useState({
        name: '',
        code: '',
        faculty_name: ''
    });

    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/dashboard');
        } else if (user) {
            fetchDepartments();
        }
    }, [user, router]);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/departments');
            if (res.data.success) {
                setDepartments(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ name: '', code: '', faculty_name: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDept) {
                await api.put(`/departments/${editingDept.id}`, form);
                setFeedback({ type: 'success', message: 'Department updated successfully!' });
            } else {
                await api.post('/departments', form);
                setFeedback({ type: 'success', message: 'Department created successfully!' });
            }
            setShowForm(false);
            setEditingDept(null);
            resetForm();
            fetchDepartments();
        } catch (error) {
            setFeedback({ type: 'error', message: error.response?.data?.message || 'Failed to save department' });
        }
    };

    const handleEdit = (dept) => {
        setEditingDept(dept);
        setForm({
            name: dept.name,
            code: dept.code,
            faculty_name: dept.faculty_name || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this department? This may affect associated courses and users.')) return;
        try {
            await api.delete(`/departments/${id}`);
            setFeedback({ type: 'success', message: 'Department deleted!' });
            fetchDepartments();
        } catch (error) {
            setFeedback({ type: 'error', message: error.response?.data?.message || 'Failed to delete department' });
        }
    };

    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];

    if (!user || user.role !== 'admin') {
        return <div>Access denied. Admin only.</div>;
    }

    return (
        <div className="admin-page-container">
            <Head>
                <title>Department Management | Admin | Smart Campus</title>
            </Head>
            <Navbar userData={user} />

            <div className="admin-content">
                <div className="admin-header">
                    <div className="admin-header-left">
                        <h1>🏛️ Department Management</h1>
                        <p>Add and manage academic departments</p>
                    </div>
                    <button className="btn-primary-gradient" onClick={() => { resetForm(); setEditingDept(null); setShowForm(true); }}>
                        + Add Department
                    </button>
                </div>

                {feedback.message && (
                    <div style={{
                        padding: '14px 20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: feedback.type === 'success' ? '#d1fae5' : '#fee2e2',
                        color: feedback.type === 'success' ? '#065f46' : '#991b1b'
                    }}>
                        {feedback.message}
                        <button style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setFeedback({ type: '', message: '' })}>×</button>
                    </div>
                )}

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card-modern">
                        <div className="stat-icon purple">🏛️</div>
                        <div className="stat-info">
                            <h3>{departments.length}</h3>
                            <p>Total Departments</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading departments...</p>
                    </div>
                ) : departments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🏛️</div>
                        <h3>No departments yet</h3>
                        <p>Add your first academic department!</p>
                    </div>
                ) : (
                    <div className="cards-grid">
                        {departments.map((dept, index) => (
                            <div key={dept.id} className="card-modern" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '24px', flex: 1 }}>
                                    <div style={{
                                        display: 'inline-block',
                                        background: gradients[index % gradients.length],
                                        color: 'white',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        fontWeight: '700',
                                        fontSize: '0.9rem',
                                        marginBottom: '16px'
                                    }}>
                                        {dept.code}
                                    </div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#1a202c', margin: '0 0 8px' }}>{dept.name}</h3>
                                    {dept.faculty_name && (
                                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 16px' }}>{dept.faculty_name}</p>
                                    )}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        <span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#475569' }}>
                                            📚 {dept.courses_count || 0} Courses
                                        </span>
                                        <span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#475569' }}>
                                            👨‍🎓 {dept.students_count || 0} Students
                                        </span>
                                    </div>
                                </div>
                                <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleEdit(dept)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: '#e0e7ff',
                                            color: '#4338ca',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(dept.id)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: '#fee2e2',
                                            color: '#dc2626',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-modern">
                        <div className="modal-header">
                            <h2>{editingDept ? 'Edit Department' : 'Add Department'}</h2>
                            <button className="modal-close" onClick={() => { setShowForm(false); setEditingDept(null); }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Department Code *</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={form.code}
                                        onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., CE, EE, BA"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department Name *</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g., Computer Engineering"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Faculty Name</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={form.faculty_name}
                                        onChange={e => setForm({ ...form, faculty_name: e.target.value })}
                                        placeholder="e.g., Engineering Faculty"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingDept(null); }}>Cancel</button>
                                <button type="submit" className="btn-primary-gradient">{editingDept ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
