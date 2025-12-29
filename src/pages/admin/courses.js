import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    BookOpen,
    Plus,
    Search,
    Trash2,
    Edit2,
    Users,
    ChevronDown,
    ChevronUp,
    MoreVertical,
    Save,
    X,
    FolderPlus
} from 'lucide-react';
import api from '../../config/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FeedbackMessage from '../../components/FeedbackMessage';
import { useAuth } from '../../context/AuthContext';

export default function AdminCourses() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useAuth();
    const [courses, setCourses] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [expandedCourse, setExpandedCourse] = useState(null);

    // Filter
    const [searchTerm, setSearchTerm] = useState('');

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
        if (!authLoading && (!user || user.role !== 'admin')) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    // Fetch data
    useEffect(() => {
        if (user?.role === 'admin') {
            fetchCourses();
            fetchDepartments();
            fetchFaculty();
        }
    }, [user]);

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
        setFeedback({ type: '', message: '' });
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
        setFeedback({ type: '', message: '' });
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

    const handleDeleteCourse = async (courseId, e) => {
        if (e) e.stopPropagation();
        if (!confirm('Are you sure you want to delete this course?')) return;

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
        // setFeedback({ type: 'loading', message: 'Creating section...' }); // Don't block UI with loading state inside modal if possible, but ok
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

    const openEditCourse = (course, e) => {
        if (e) e.stopPropagation();
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

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || !user || user.role !== 'admin') return null;

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>Course Management | Admin | Smart Campus</title>
            </Head>

            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                            Course Management
                        </h1>
                        <p className="mt-1 text-gray-500">Create and manage courses and their sections</p>
                    </div>
                    <button
                        onClick={() => { resetCourseForm(); setEditingCourse(null); setShowCourseForm(true); }}
                        className="btn-primary-gradient flex items-center justify-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Create Course
                    </button>
                </div>

                {/* Feedback */}
                <FeedbackMessage
                    type={feedback.type}
                    message={feedback.message}
                    onClose={() => setFeedback({ type: '', message: '' })}
                />

                {/* Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>

                {/* Course List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading courses...</p>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
                            <p className="text-gray-500 mt-1">Get started by creating a new course.</p>
                        </div>
                    ) : (
                        filteredCourses.map(course => (
                            <div
                                key={course.id}
                                className={`bg-white rounded-xl shadow-sm border transition-all duration-200 overflow-hidden ${expandedCourse === course.id ? 'ring-2 ring-blue-500/20 border-blue-500/50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div
                                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                            {course.code.split('-')[0] || course.code.substring(0, 3)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900">{course.code}</h3>
                                                <span className="text-gray-400">•</span>
                                                <span className="font-medium text-gray-700">{course.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                                                <span>{course.credits} Credits</span>
                                                <span>•</span>
                                                <span>{course.sections?.length || 0} Sections</span>
                                                {course.department && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{course.department.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => openEditCourse(course, e)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Course"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteCourse(course.id, e)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Course"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <div className={`transform transition-transform duration-200 ${expandedCourse === course.id ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Sections Panel */}
                                {expandedCourse === course.id && (
                                    <div className="border-t border-gray-100 bg-gray-50/50 p-6 animate-in slide-in-from-top-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-500" />
                                                Active Sections
                                            </h4>
                                            <button
                                                onClick={() => openAddSection(course.id)}
                                                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-200 bg-white"
                                            >
                                                + Add Section
                                            </button>
                                        </div>

                                        {course.sections && course.sections.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {course.sections.map(section => (
                                                    <div key={section.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-bold text-gray-900">Section {section.section_number}</span>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${section.semester === 'Fall' ? 'bg-orange-50 text-orange-700' :
                                                                        section.semester === 'Spring' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                                                                    }`}>
                                                                    {section.semester} {section.year}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {section.instructor?.user?.first_name ?
                                                                    `Instr. ${section.instructor.user.first_name} ${section.instructor.user.last_name}` :
                                                                    'No instructor assigned'
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                {section.enrolled_count}/{section.capacity} Enrolled
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteSection(course.id, section.id)}
                                                            className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500 text-sm italic bg-white rounded-lg border border-gray-200 border-dashed">
                                                No sections created yet.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Create/Edit Course Modal */}
                {showCourseForm && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowCourseForm(false)} aria-hidden="true"></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-start mb-5">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                                            {editingCourse ? 'Edit Course' : 'Create New Course'}
                                        </h3>
                                        <button onClick={() => setShowCourseForm(false)} className="text-gray-400 hover:text-gray-500">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <form onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={courseForm.code}
                                                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                                                    placeholder="e.g. CS101"
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={courseForm.name}
                                                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                                                    placeholder="Introduction to CS"
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                            <select
                                                value={courseForm.department_id}
                                                onChange={(e) => setCourseForm({ ...courseForm, department_id: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map(dept => (
                                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                rows={3}
                                                value={courseForm.description}
                                                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={courseForm.credits}
                                                    onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">ECTS</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={courseForm.ects}
                                                    onChange={(e) => setCourseForm({ ...courseForm, ects: parseInt(e.target.value) })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-4 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowCourseForm(false)}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                {editingCourse ? 'Save Changes' : 'Create Course'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Section Modal */}
                {showSectionForm && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowSectionForm(false)} aria-hidden="true"></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-start mb-5">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900">
                                            Add New Section
                                        </h3>
                                        <button onClick={() => setShowSectionForm(false)} className="text-gray-400 hover:text-gray-500">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <form onSubmit={handleCreateSection} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                                <select
                                                    value={sectionForm.semester}
                                                    onChange={(e) => setSectionForm({ ...sectionForm, semester: e.target.value })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                >
                                                    <option value="Fall">Fall</option>
                                                    <option value="Spring">Spring</option>
                                                    <option value="Summer">Summer</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                                <input
                                                    type="number"
                                                    value={sectionForm.year}
                                                    onChange={(e) => setSectionForm({ ...sectionForm, year: parseInt(e.target.value) })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Section No</label>
                                                <input
                                                    type="text"
                                                    value={sectionForm.section_number}
                                                    onChange={(e) => setSectionForm({ ...sectionForm, section_number: e.target.value })}
                                                    placeholder="01"
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                                                <input
                                                    type="number"
                                                    value={sectionForm.capacity}
                                                    onChange={(e) => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value) })}
                                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                                            <select
                                                value={sectionForm.instructor_id}
                                                onChange={(e) => setSectionForm({ ...sectionForm, instructor_id: e.target.value })}
                                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="">-- No Instructor --</option>
                                                {faculty.map(f => (
                                                    <option key={f.id} value={f.profile?.id || ''}>
                                                        {f.first_name} {f.last_name} {f.email ? `(${f.email})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="pt-4 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowSectionForm(false)}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700"
                                            >
                                                Add Section
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
