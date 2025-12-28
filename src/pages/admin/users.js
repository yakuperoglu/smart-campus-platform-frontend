import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import { useRouter } from 'next/router';

export default function UserManagement() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    // Edit Modal State
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
        } else if (user) {
            fetchUsers();
        }
    }, [user, authLoading, router, page, roleFilter]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (user && user.role === 'admin') fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 10, search, role: roleFilter };
            const res = await userService.getAllUsers(params);
            if (res.data.success) {
                setUsers(res.data.data.users);
                setTotalPages(res.data.data.pagination.totalPages);
                setTotalUsers(res.data.data.pagination.total || res.data.data.users.length);
            }
        } catch (error) {
            console.error('Fetch users error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await userService.deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditForm({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            role: user.role,
        });
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await userService.updateUser(editingUser.id, editForm);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            alert('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'student': return 'badge-student';
            case 'faculty': return 'badge-faculty';
            case 'admin': return 'badge-admin';
            default: return '';
        }
    };

    return (
        <div className="admin-page-container">
            <Head>
                <title>User Management | Admin | Smart Campus</title>
            </Head>
            <Navbar userData={user} />

            <div className="admin-content">
                <div className="admin-header">
                    <div className="admin-header-left">
                        <h1>👥 User Management</h1>
                        <p>View and manage all platform users</p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="stats-row">
                    <div className="stat-card-modern">
                        <div className="stat-icon purple">👥</div>
                        <div className="stat-info">
                            <h3>{totalUsers}</h3>
                            <p>Total Users</p>
                        </div>
                    </div>
                    <div className="stat-card-modern">
                        <div className="stat-icon green">🎓</div>
                        <div className="stat-info">
                            <h3>{users.filter(u => u.role === 'student').length}</h3>
                            <p>Students</p>
                        </div>
                    </div>
                    <div className="stat-card-modern">
                        <div className="stat-icon blue">👨‍🏫</div>
                        <div className="stat-info">
                            <h3>{users.filter(u => u.role === 'faculty').length}</h3>
                            <p>Faculty</p>
                        </div>
                    </div>
                    <div className="stat-card-modern">
                        <div className="stat-icon orange">🛡️</div>
                        <div className="stat-info">
                            <h3>{users.filter(u => u.role === 'admin').length}</h3>
                            <p>Admins</p>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="table-container">
                    <div className="table-header">
                        <h2>All Users</h2>
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="search-input"
                            />
                            <select
                                value={roleFilter}
                                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                                className="filter-select"
                            >
                                <option value="">All Roles</option>
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">👤</div>
                            <h3>No users found</h3>
                            <p>Try adjusting your search or filter criteria</p>
                        </div>
                    ) : (
                        <>
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="user-cell">
                                                    {u.profile_picture_url ? (
                                                        <img src={u.profile_picture_url} alt="Profile" className="user-avatar" />
                                                    ) : (
                                                        <div className="user-avatar-placeholder">{u.email[0].toUpperCase()}</div>
                                                    )}
                                                    <div className="user-details">
                                                        <div className="name">{u.first_name} {u.last_name}</div>
                                                        <div className="email">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${getRoleBadgeClass(u.role)}`}>{u.role}</span>
                                            </td>
                                            <td>
                                                {u.is_verified ? (
                                                    <span className="badge badge-verified">✓ Verified</span>
                                                ) : (
                                                    <span className="badge badge-pending">Pending</span>
                                                )}
                                            </td>
                                            <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="btn-action edit" onClick={() => handleEditClick(u)} title="Edit">✏️</button>
                                                    <button className="btn-action delete" onClick={() => handleDelete(u.id)} title="Delete">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    ← Previous
                                </button>
                                <span className="pagination-info">Page {page} of {totalPages}</span>
                                <button
                                    className="pagination-btn"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-modern">
                        <div className="modal-header">
                            <h2>Edit User</h2>
                            <button className="modal-close" onClick={() => setEditingUser(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input
                                    className="form-input"
                                    value={editForm.first_name}
                                    onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input
                                    className="form-input"
                                    value={editForm.last_name}
                                    onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select
                                    className="form-select"
                                    value={editForm.role}
                                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                >
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                            <button className="btn-primary-gradient" onClick={handleSaveEdit} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
