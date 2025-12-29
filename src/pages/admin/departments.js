import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Building2,
    Plus,
    Search,
    Trash2,
    Edit2,
    Users,
    BookOpen,
    GraduationCap,
    MoreVertical,
    X,
    School
} from 'lucide-react';
import api from '../../config/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function AdminDepartments() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
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
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
        } else if (user) {
            fetchDepartments();
        }
    }, [user, authLoading, router]);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/departments');
            if (res.data.success) {
                setDepartments(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            setFeedback({ type: 'error', message: 'Failed to load departments' });
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
        'from-blue-500 to-indigo-600',
        'from-emerald-400 to-teal-600',
        'from-rose-400 to-red-600',
        'from-violet-400 to-purple-600',
        'from-orange-400 to-amber-600',
        'from-pink-400 to-rose-600'
    ];

    if (authLoading || !user || user.role !== 'admin') return null;

    return (
        <DashboardLayout user={user}>
            <Head>
                <title>Department Management | Admin | Smart Campus</title>
            </Head>

            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Building2 className="h-6 w-6 text-indigo-600" />
                            Department Management
                        </h1>
                        <p className="mt-1 text-gray-500">Add and manage academic departments</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setEditingDept(null); setShowForm(true); }}
                        className="btn-primary-gradient flex items-center justify-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Department
                    </button>
                </div>

                {/* Feedback */}
                {feedback.message && (
                    <div className={`p-4 rounded-xl flex items-center justify-between ${feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        <span>{feedback.message}</span>
                        <button onClick={() => setFeedback({ type: '', message: '' })} className="hover:opacity-70">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{departments.length}</h3>
                                <p className="text-sm text-gray-500">Total Departments</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Departments Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading departments...</p>
                    </div>
                ) : departments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                        <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No departments yet</h3>
                        <p className="text-gray-500 mt-1">Add your first academic department!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {departments.map((dept, index) => (
                            <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                <div className="p-6 flex-1">
                                    <div className={`inline-block bg-gradient-to-br ${gradients[index % gradients.length]} text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm mb-4`}>
                                        {dept.code}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{dept.name}</h3>
                                    {dept.faculty_name && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                            <School className="h-4 w-4" />
                                            {dept.faculty_name}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                            <BookOpen className="h-3 w-3" /> {dept.courses_count || 0} Courses
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                            <GraduationCap className="h-3 w-3" /> {dept.students_count || 0} Students
                                        </span>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                                    <button
                                        onClick={() => handleEdit(dept)}
                                        className="flex-1 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit2 className="h-4 w-4" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(dept.id)}
                                        className="flex-1 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowForm(false)} aria-hidden="true"></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-start mb-5">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                            {editingDept ? 'Edit Department' : 'Add Department'}
                                        </h3>
                                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-500">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department Code *</label>
                                            <input
                                                type="text"
                                                value={form.code}
                                                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                                placeholder="e.g., CE, EE, BA"
                                                required
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={e => setForm({ ...form, name: e.target.value })}
                                                placeholder="e.g., Computer Engineering"
                                                required
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Name</label>
                                            <input
                                                type="text"
                                                value={form.faculty_name}
                                                onChange={e => setForm({ ...form, faculty_name: e.target.value })}
                                                placeholder="e.g., Engineering Faculty"
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => setShowForm(false)}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700"
                                            >
                                                {editingDept ? 'Update' : 'Create'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}
