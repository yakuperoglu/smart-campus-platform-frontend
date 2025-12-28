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

    if (!user || user.role !== 'admin') {
        return <div>Access denied. Admin only.</div>;
    }

    return (
        <div className="page-container">
            <Head>
                <title>Department Management | Admin | Smart Campus</title>
            </Head>
            <Navbar userData={user} />

            <div className="content">
                <div className="header-row">
                    <h1>🏛️ Department Management</h1>
                    <button className="btn-primary" onClick={() => { resetForm(); setEditingDept(null); setShowForm(true); }}>
                        + Add Department
                    </button>
                </div>

                {feedback.message && (
                    <div className={`feedback ${feedback.type}`}>
                        {feedback.message}
                        <button onClick={() => setFeedback({ type: '', message: '' })}>×</button>
                    </div>
                )}

                {showForm && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h2>{editingDept ? 'Edit Department' : 'Add Department'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Department Code *</label>
                                    <input
                                        type="text"
                                        value={form.code}
                                        onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., CE, EE, BA"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Department Name *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g., Computer Engineering"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Faculty Name</label>
                                    <input
                                        type="text"
                                        value={form.faculty_name}
                                        onChange={e => setForm({ ...form, faculty_name: e.target.value })}
                                        placeholder="e.g., Engineering Faculty"
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingDept(null); }}>Cancel</button>
                                    <button type="submit" className="btn-primary">{editingDept ? 'Update' : 'Create'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="loading">Loading departments...</div>
                ) : departments.length === 0 ? (
                    <div className="empty">No departments found. Add your first department!</div>
                ) : (
                    <div className="departments-grid">
                        {departments.map(dept => (
                            <div key={dept.id} className="dept-card">
                                <div className="dept-code">{dept.code}</div>
                                <h3>{dept.name}</h3>
                                {dept.faculty_name && <p className="faculty">{dept.faculty_name}</p>}
                                <div className="dept-stats">
                                    <span>📚 {dept.courses_count || 0} Courses</span>
                                    <span>👨‍🎓 {dept.students_count || 0} Students</span>
                                    <span>👨‍🏫 {dept.faculty_count || 0} Faculty</span>
                                </div>
                                <div className="dept-actions">
                                    <button onClick={() => handleEdit(dept)}>Edit</button>
                                    <button className="delete" onClick={() => handleDelete(dept.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .page-container { background: #f3f4f6; min-height: 100vh; }
                .content { max-width: 1200px; margin: 20px auto; padding: 20px; }
                .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                h1 { font-size: 1.75rem; font-weight: bold; color: #1a202c; }
                .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; }
                .btn-secondary { background: #e5e7eb; color: #374151; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
                .feedback { padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; }
                .feedback.success { background: #d1fae5; color: #065f46; }
                .feedback.error { background: #fee2e2; color: #991b1b; }
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal { background: white; padding: 30px; border-radius: 12px; width: 100%; max-width: 450px; }
                .modal h2 { margin-bottom: 20px; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
                .form-group input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
                .departments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
                .dept-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
                .dept-code { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.9rem; margin-bottom: 10px; }
                .dept-card h3 { margin: 0 0 5px 0; font-size: 1.1rem; color: #1a202c; }
                .faculty { color: #6b7280; font-size: 0.9rem; margin: 0 0 15px 0; }
                .dept-stats { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; }
                .dept-stats span { background: #f3f4f6; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; color: #4b5563; }
                .dept-actions { display: flex; gap: 10px; }
                .dept-actions button { flex: 1; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 500; }
                .dept-actions button:first-child { background: #e0e7ff; color: #3730a3; border: none; }
                .dept-actions button.delete { background: #fee2e2; color: #991b1b; border: none; }
                .loading, .empty { text-align: center; padding: 40px; color: #6b7280; }
            `}</style>
        </div>
    );
}
