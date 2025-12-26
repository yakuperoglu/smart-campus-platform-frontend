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
    }, [user, authLoading, router, page, roleFilter]); // Re-fetch on filter change

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
            // Role specific fields could be added here
        });
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await userService.updateUser(editingUser.id, editForm);
            setEditingUser(null);
            fetchUsers(); // Refresh list
        } catch (error) {
            alert('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="page-container">
            <Head>
                <title>User Management - Admin</title>
            </Head>
            <Navbar userData={user} />

            <div className="content">
                <div className="header-row">
                    <h1>👥 User Management</h1>
                    {/* <button className="btn-primary">+ Add User</button> */}
                </div>

                <div className="filters-bar">
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

                {loading ? (
                    <div className="loading">Loading users...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="user-table">
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
                                        <td className="user-cell">
                                            {u.profile_picture_url ? (
                                                <img src={u.profile_picture_url} alt="Profile" className="avatar-small" />
                                            ) : (
                                                <div className="avatar-placeholder">{u.email[0].toUpperCase()}</div>
                                            )}
                                            <div className="user-info">
                                                <span className="user-name">{u.first_name} {u.last_name}</span>
                                                <span className="user-email">{u.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge role-${u.role}`}>{u.role}</span>
                                        </td>
                                        <td>
                                            {u.is_verified ? (
                                                <span className="badge success">Verified</span>
                                            ) : (
                                                <span className="badge warning">Pending</span>
                                            )}
                                        </td>
                                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn-icon" onClick={() => handleEditClick(u)}>✏️</button>
                                            <button className="btn-icon delete" onClick={() => handleDelete(u.id)}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="pagination">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Previous
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Edit User</h3>
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                value={editForm.first_name}
                                onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                value={editForm.last_name}
                                onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <select
                                value={editForm.role}
                                onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                            >
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveEdit} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .page-container { background: #f3f4f6; min-height: 100vh; }
                .content { 
                    max-width: 1200px; 
                    margin: 20px auto; 
                    padding: 20px; 
                    background: white; 
                    border-radius: 10px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); 
                }
                .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .filters-bar { display: flex; gap: 15px; margin-bottom: 20px; }
                .search-input { 
                    flex: 1; 
                    padding: 10px; 
                    border: 1px solid #ddd; 
                    border-radius: 6px; 
                }
                .filter-select { padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
                
                .user-table { width: 100%; border-collapse: collapse; }
                .user-table th { text-align: left; padding: 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 0.85rem; }
                .user-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
                
                .user-cell { display: flex; align-items: center; gap: 10px; }
                .avatar-small { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
                .avatar-placeholder { width: 36px; height: 36px; border-radius: 50%; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; }
                .user-info { display: flex; flex-direction: column; }
                .user-name { font-weight: 500; color: #111827; }
                .user-email { font-size: 0.8rem; color: #6b7280; }
                
                .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
                .badge.role-student { background: #dbeafe; color: #1e40af; }
                .badge.role-faculty { background: #d1fae5; color: #065f46; }
                .badge.role-admin { background: #fee2e2; color: #991b1b; }
                .success { background: #d1fae5; color: #065f46; }
                .warning { background: #fef3c7; color: #92400e; }
                
                .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 5px; opacity: 0.7; transition: 0.2s; }
                .btn-icon:hover { opacity: 1; transform: scale(1.1); }
                .btn-icon.delete:hover { color: #ef4444; }

                .pagination { display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 20px; }
                .pagination button { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; }
                .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }

                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(2px);
                }
                .modal { background: white; padding: 25px; border-radius: 12px; width: 400px; max-width: 90%; }
                .modal h3 { margin-top: 0; margin-bottom: 20px; }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
                .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
                .btn-primary { background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
                .btn-secondary { background: #e5e7eb; color: #374151; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
            `}</style>
        </div>
    );
}
