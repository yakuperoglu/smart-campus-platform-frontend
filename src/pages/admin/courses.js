import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '../../config/api';
import Navbar from '../../components/Navbar';
import FeedbackMessage from '../../components/FeedbackMessage';
import { useAuth } from '../../context/AuthContext';

export default function AdminCourses() {
    const router = useRouter();
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [expandedCourse, setExpandedCourse] = useState(null);

    // Course form state
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [courseForm, setCourseForm] = useState({
        code: '',
        name: '',
        description: '',
        credits: 3,
        ects: 5,
        department_id: ''
    });

    // Section form state
    const [showSectionForm, setShowSectionForm] = useState(false);
    const [sectionForCourse, setSectionForCourse] = useState(null);
    const [sectionForm, setSectionForm] = useState({
        semester: 'Fall',
        year: new Date().getFullYear(),
        section_number: '01',
        capacity: 30,
        instructor_id: '',
        schedule_json: []
    });

    // Check admin access
    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, router]);

    // Fetch data
    useEffect(() => {
        fetchCourses();
        fetchDepartments();
        fetchFaculty();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            if (response.data.success) {
                setCourses(response.data.data.courses);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            setFeedback({ type: 'error', message: 'Failed to load courses' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/departments');
            if (response.data.success) {
                setDepartments(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchFaculty = async () => {
        try {
            const response = await api.get('/users?role=faculty');
            if (response.data.success) {
                setFaculty(response.data.data.users || []);
            }
        } catch (error) {
            console.error('Error fetching faculty:', error);
        }
    };

    // Course CRUD
    const handleCreateCourse = async (e) => {
        e.preventDefault();
        setFeedback({ type: 'loading', message: 'Creating course...' });
        try {
            const response = await api.post('/courses', courseForm);
            if (response.data.success) {
                setFeedback({ type: 'success', message: 'Course created successfully!' });
                setShowCourseForm(false);
                resetCourseForm();
                fetchCourses();
            }
        } catch (error) {
            const msg = error.response?.data?.error?.message || 'Failed to create course';
            setFeedback({ type: 'error', message: msg });
        }
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        setFeedback({ type: 'loading', message: 'Updating course...' });
        try {
            const response = await api.put(`/courses/${editingCourse.id}`, courseForm);
            if (response.data.success) {
                setFeedback({ type: 'success', message: 'Course updated successfully!' });
                setEditingCourse(null);
                setShowCourseForm(false);
                resetCourseForm();
                fetchCourses();
            }
        } catch (error) {
            const msg = error.response?.data?.error?.message || 'Failed to update course';
            setFeedback({ type: 'error', message: msg });
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!confirm('Are you sure you want to delete this course?')) return;
        setFeedback({ type: 'loading', message: 'Deleting course...' });
        try {
            await api.delete(`/courses/${courseId}`);
            setFeedback({ type: 'success', message: 'Course deleted successfully!' });
            fetchCourses();
        } catch (error) {
            const msg = error.response?.data?.error?.message || 'Failed to delete course';
            setFeedback({ type: 'error', message: msg });
        }
    };

    // Section CRUD
    const handleCreateSection = async (e) => {
        e.preventDefault();
        setFeedback({ type: 'loading', message: 'Creating section...' });
        try {
            const response = await api.post(`/courses/${sectionForCourse}/sections`, sectionForm);
            if (response.data.success) {
                setFeedback({ type: 'success', message: 'Section created successfully!' });
                setShowSectionForm(false);
                resetSectionForm();
                fetchCourses();
            }
        } catch (error) {
            const msg = error.response?.data?.error?.message || 'Failed to create section';
            setFeedback({ type: 'error', message: msg });
        }
    };

    const handleDeleteSection = async (courseId, sectionId) => {
        if (!confirm('Are you sure you want to delete this section?')) return;
        setFeedback({ type: 'loading', message: 'Deleting section...' });
        try {
            await api.delete(`/courses/${courseId}/sections/${sectionId}`);
            setFeedback({ type: 'success', message: 'Section deleted successfully!' });
            fetchCourses();
        } catch (error) {
            const msg = error.response?.data?.error?.message || 'Failed to delete section';
            setFeedback({ type: 'error', message: msg });
        }
    };

    const resetCourseForm = () => {
        setCourseForm({
            code: '',
            name: '',
            description: '',
            credits: 3,
            ects: 5,
            department_id: ''
        });
    };

    const resetSectionForm = () => {
        setSectionForm({
            semester: 'Fall',
            year: new Date().getFullYear(),
            section_number: '01',
            capacity: 30,
            instructor_id: '',
            schedule_json: []
        });
    };

    const openEditCourse = (course) => {
        setEditingCourse(course);
        setCourseForm({
            code: course.code,
            name: course.name,
            description: course.description || '',
            credits: course.credits,
            ects: course.ects || 5,
            department_id: course.department?.id || ''
        });
        setShowCourseForm(true);
    };

    const openAddSection = (courseId) => {
        setSectionForCourse(courseId);
        resetSectionForm();
        setShowSectionForm(true);
    };

    if (!user || user.role !== 'admin') {
        return <div>Access denied. Admin only.</div>;
    }

    return (
        <div style={{ backgroundColor: '#f7fafc', minHeight: '100vh' }}>
            <Head>
                <title>Course Management | Admin | Smart Campus</title>
            </Head>

            <Navbar userData={user} />

            <FeedbackMessage
                type={feedback.type}
                message={feedback.message}
                onClose={() => setFeedback({ type: '', message: '' })}
            />

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1a202c' }}>
                        📚 Course Management
                    </h1>
                    <button
                        onClick={() => { resetCourseForm(); setEditingCourse(null); setShowCourseForm(true); }}
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        + Create Course
                    </button>
                </header>

                {/* Course Form Modal */}
                {showCourseForm && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white', padding: '2rem', borderRadius: '12px',
                            width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'
                        }}>
                            <h2 style={{ marginBottom: '1rem' }}>
                                {editingCourse ? 'Edit Course' : 'Create New Course'}
                            </h2>
                            <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                        Course Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={courseForm.code}
                                        onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                                        required
                                        placeholder="e.g., CE101"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                        Course Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={courseForm.name}
                                        onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                                        required
                                        placeholder="e.g., Introduction to Programming"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                        Description
                                    </label>
                                    <textarea
                                        value={courseForm.description}
                                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                                        placeholder="Course description..."
                                        rows={3}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                            Credits
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={courseForm.credits}
                                            onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                            ECTS
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="15"
                                            value={courseForm.ects}
                                            onChange={(e) => setCourseForm({ ...courseForm, ects: parseInt(e.target.value) })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                        Department
                                    </label>
                                    <select
                                        value={courseForm.department_id}
                                        onChange={(e) => setCourseForm({ ...courseForm, department_id: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                    >
                                        <option value="">-- Select Department --</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.code} - {dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => { setShowCourseForm(false); setEditingCourse(null); }}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '6px',
                                            border: '1px solid #ddd', background: 'white', cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '6px',
                                            border: 'none', background: '#4299e1', color: 'white', cursor: 'pointer'
                                        }}
                                    >
                                        {editingCourse ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Section Form Modal */}
                {showSectionForm && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{
                            background: 'white', padding: '2rem', borderRadius: '12px',
                            width: '100%', maxWidth: '500px'
                        }}>
                            <h2 style={{ marginBottom: '1rem' }}>Add New Section</h2>
                            <form onSubmit={handleCreateSection}>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                            Semester *
                                        </label>
                                        <select
                                            value={sectionForm.semester}
                                            onChange={(e) => setSectionForm({ ...sectionForm, semester: e.target.value })}
                                            required
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                        >
                                            <option value="Fall">Fall</option>
                                            <option value="Spring">Spring</option>
                                            <option value="Summer">Summer</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                            Year *
                                        </label>
                                        <input
                                            type="number"
                                            min="2020"
                                            max="2100"
                                            value={sectionForm.year}
                                            onChange={(e) => setSectionForm({ ...sectionForm, year: parseInt(e.target.value) })}
                                            required
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                            Section Number
                                        </label>
                                        <input
                                            type="text"
                                            value={sectionForm.section_number}
                                            onChange={(e) => setSectionForm({ ...sectionForm, section_number: e.target.value })}
                                            placeholder="01"
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                            Capacity
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={sectionForm.capacity}
                                            onChange={(e) => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value) })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                        Instructor
                                    </label>
                                    <select
                                        value={sectionForm.instructor_id}
                                        onChange={(e) => setSectionForm({ ...sectionForm, instructor_id: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                    >
                                        <option value="">-- Select Instructor (Optional) --</option>
                                        {faculty.map(f => (
                                            <option key={f.id} value={f.profile?.id || ''}>
                                                {f.email} {f.profile?.title ? `(${f.profile.title})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowSectionForm(false)}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '6px',
                                            border: '1px solid #ddd', background: 'white', cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '6px',
                                            border: 'none', background: '#48bb78', color: 'white', cursor: 'pointer'
                                        }}
                                    >
                                        Add Section
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Courses List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <p>Loading courses...</p>
                    </div>
                ) : courses.length === 0 ? (
                    <div style={{
                        background: 'white', padding: '3rem', borderRadius: '12px',
                        textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <h3>No courses yet</h3>
                        <p style={{ color: '#718096' }}>Click "Create Course" to add your first course.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {courses.map(course => (
                            <div
                                key={course.id}
                                style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{
                                    padding: '1rem 1.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: expandedCourse === course.id ? '1px solid #e2e8f0' : 'none'
                                }}>
                                    <div
                                        style={{ cursor: 'pointer', flex: 1 }}
                                        onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{
                                                background: '#667eea',
                                                color: 'white',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '6px',
                                                fontWeight: '600',
                                                fontSize: '0.875rem'
                                            }}>
                                                {course.code}
                                            </span>
                                            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{course.name}</span>
                                            <span style={{ color: '#718096', fontSize: '0.875rem' }}>
                                                {course.credits} Credits
                                            </span>
                                            <span style={{ color: '#a0aec0', fontSize: '0.875rem' }}>
                                                ({course.sections?.length || 0} sections)
                                            </span>
                                        </div>
                                        {course.department && (
                                            <div style={{ fontSize: '0.875rem', color: '#718096', marginTop: '0.25rem' }}>
                                                {course.department.name}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => openEditCourse(course)}
                                            style={{
                                                padding: '0.5rem 1rem', borderRadius: '6px',
                                                border: '1px solid #4299e1', background: 'white',
                                                color: '#4299e1', cursor: 'pointer', fontSize: '0.875rem'
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCourse(course.id)}
                                            style={{
                                                padding: '0.5rem 1rem', borderRadius: '6px',
                                                border: '1px solid #e53e3e', background: 'white',
                                                color: '#e53e3e', cursor: 'pointer', fontSize: '0.875rem'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded sections */}
                                {expandedCourse === course.id && (
                                    <div style={{ padding: '1rem 1.5rem', background: '#f7fafc' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h4 style={{ margin: 0 }}>Sections</h4>
                                            <button
                                                onClick={() => openAddSection(course.id)}
                                                style={{
                                                    padding: '0.375rem 0.75rem', borderRadius: '6px',
                                                    border: 'none', background: '#48bb78', color: 'white',
                                                    cursor: 'pointer', fontSize: '0.875rem'
                                                }}
                                            >
                                                + Add Section
                                            </button>
                                        </div>
                                        {course.sections && course.sections.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {course.sections.map(section => (
                                                    <div
                                                        key={section.id}
                                                        style={{
                                                            background: 'white',
                                                            padding: '0.75rem 1rem',
                                                            borderRadius: '8px',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            border: '1px solid #e2e8f0'
                                                        }}
                                                    >
                                                        <div>
                                                            <span style={{ fontWeight: '500' }}>
                                                                Section {section.section_number}
                                                            </span>
                                                            <span style={{ color: '#718096', marginLeft: '1rem' }}>
                                                                {section.semester} {section.year}
                                                            </span>
                                                            <span style={{ color: '#718096', marginLeft: '1rem' }}>
                                                                Capacity: {section.enrolled_count}/{section.capacity}
                                                            </span>
                                                            <span style={{ color: '#718096', marginLeft: '1rem' }}>
                                                                Instructor: {section.instructor?.name || 'TBA'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteSection(course.id, section.id)}
                                                            style={{
                                                                padding: '0.25rem 0.5rem', borderRadius: '4px',
                                                                border: '1px solid #e53e3e', background: 'white',
                                                                color: '#e53e3e', cursor: 'pointer', fontSize: '0.75rem'
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>
                                                No sections yet. Click "Add Section" to create one.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
