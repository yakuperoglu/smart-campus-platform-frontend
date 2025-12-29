/**
 * Faculty Grades Management Page
 * View sections and manage student grades
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../config/api';
import FeedbackMessage from '../../components/FeedbackMessage';
import {
    BookOpen,
    Users,
    ChevronRight,
    Save,
    Search,
    AlertCircle,
    CheckCircle,
    User,
    Calendar
} from 'lucide-react';

export default function FacultyGrades() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useAuth();

    // State
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [editedGrades, setEditedGrades] = useState({}); // { enrollmentId: { midterm, final } }

    // Redirect if not faculty
    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'faculty')) {
            router.push('/dashboard');
        }
    }, [authLoading, user, router]);

    // Fetch Sections
    useEffect(() => {
        const fetchSections = async () => {
            if (!user || user.role !== 'faculty') return;

            try {
                setLoading(true);
                const response = await api.get('/sections/my-sections');

                if (response.data.success) {
                    setSections(response.data.data.sections || []);
                }
            } catch (err) {
                console.error('Error fetching sections:', err);
                setError('Failed to load your course sections.');
            } finally {
                setLoading(false);
            }
        };

        fetchSections();
    }, [user]);

    // Fetch Students when section selected
    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedSection) return;

            try {
                setLoadingStudents(true);
                setEditedGrades({}); // Reset edits on section change
                const response = await api.get(`/sections/${selectedSection.id}/enrollments`);

                if (response.data.success) {
                    setStudents(response.data.data.enrollments || []);
                }
            } catch (err) {
                console.error('Error fetching students:', err);
                setError('Failed to load student list.');
            } finally {
                setLoadingStudents(false);
            }
        };

        fetchStudents();
    }, [selectedSection]);

    // Handle Grade Change
    const handleGradeChange = (enrollmentId, type, value) => {
        // Validate input (0-100 or empty)
        if (value !== '' && (isNaN(value) || value < 0 || value > 100)) return;

        setEditedGrades(prev => ({
            ...prev,
            [enrollmentId]: {
                ...prev[enrollmentId],
                [type]: value
            }
        }));
    };

    // Save Grades
    const handleSave = async () => {
        if (Object.keys(editedGrades).length === 0) return;

        try {
            setSaving(true);
            setMessage({ type: '', text: '' });

            // Prepare payload
            const gradesPayload = Object.entries(editedGrades).map(([enrollmentId, grades]) => {
                const payload = { enrollment_id: enrollmentId };
                // Only include if defined (allow existing value to update only one field if needed, 
                // but usually we want to send what changed. Backend bulk update expects both or merges? 
                // The bulk controller validator allows optional fields but let's check. 
                // Wait, bulkUpdateGradesValidator likely requires both? NO, usually partial updates are fine.
                // Looking at controller: it constructs update object. 
                // Let's send what we have.
                if (grades.midterm !== undefined) payload.midterm_grade = grades.midterm === '' ? null : Number(grades.midterm);
                if (grades.final !== undefined) payload.final_grade = grades.final === '' ? null : Number(grades.final);
                return payload;
            });

            const response = await api.post(`/sections/${selectedSection.id}/grades`, {
                grades: gradesPayload
            });

            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: `Successfully updated ${response.data.data.successful.length} grades.`
                });

                // Clear edits
                setEditedGrades({});

                // Refresh list
                const refreshRes = await api.get(`/sections/${selectedSection.id}/enrollments`);
                if (refreshRes.data.success) {
                    setStudents(refreshRes.data.data.enrollments || []);
                }
            }
        } catch (err) {
            console.error('Error saving grades:', err);
            setMessage({
                type: 'error',
                text: err.response?.data?.error?.message || 'Failed to save grades. Please verify inputs.'
            });
        } finally {
            setSaving(false);
        }
    };

    // Filter students
    const filteredStudents = students.filter(student =>
        student.student.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student.user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student.user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'faculty') return null;

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>Grade Management - Smart Campus</title>
            </Head>

            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                            Grade Management
                        </h1>
                        <p className="mt-1 text-gray-500">Enter and update student grades for your courses</p>
                    </div>

                    {selectedSection && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedSection(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Change Section
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || Object.keys(editedGrades).length === 0}
                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${Object.keys(editedGrades).length > 0
                                        ? 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'
                                        : 'bg-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes ({Object.keys(editedGrades).length})
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {message.text && (
                    <FeedbackMessage
                        type={message.type}
                        message={message.text}
                        onClose={() => setMessage({ type: '', text: '' })}
                    />
                )}

                {/* Main Content */}
                {!selectedSection ? (
                    /* Section List View */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sections.length === 0 ? (
                            <div className="col-span-full">
                                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                                    <BookOpen className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">You don't have any assigned sections yet.</p>
                                </div>
                            </div>
                        ) : (
                            sections.map(section => (
                                <div
                                    key={section.id}
                                    onClick={() => setSelectedSection(section)}
                                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                            <BookOpen className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${section.year === new Date().getFullYear() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {section.semester} {section.year}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                        {section.course.code}
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-1 mb-4">
                                        {section.course.name}
                                    </p>

                                    <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-4 w-4" />
                                            <span>Section {section.section_number}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-gray-900">{section.enrolled_count}</span>
                                            <span>Students</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* Student List and Grading Interface */
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Toolbar */}
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex-1 w-full relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-semibold">{filteredStudents.length}</span> Students Enrolled
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-white">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Midterm (40%)</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Final (60%)</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Letter</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {loadingStudents ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center">
                                                <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                No students found matching your search.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((enrollment) => {
                                            const edits = editedGrades[enrollment.id] || {};
                                            const midterm = edits.midterm !== undefined ? edits.midterm : (enrollment.midterm_grade ?? '');
                                            const final = edits.final !== undefined ? edits.final : (enrollment.final_grade ?? '');
                                            const isChanged = edits.midterm !== undefined || edits.final !== undefined;

                                            return (
                                                <tr key={enrollment.id} className={`hover:bg-blue-50/20 transition-colors ${isChanged ? 'bg-yellow-50/30' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-white">
                                                                {enrollment.student.user?.first_name?.[0] || 'S'}
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {enrollment.student.user?.first_name} {enrollment.student.user?.last_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500 font-mono">
                                                                    {enrollment.student.student_number}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            className={`block w-full px-3 py-1.5 text-center text-sm border rounded-md focus:ring-blue-500 focus:border-blue-500 ${edits.midterm !== undefined ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                                                                }`}
                                                            placeholder="-"
                                                            value={midterm}
                                                            onChange={(e) => handleGradeChange(enrollment.id, 'midterm', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            className={`block w-full px-3 py-1.5 text-center text-sm border rounded-md focus:ring-blue-500 focus:border-blue-500 ${edits.final !== undefined ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                                                                }`}
                                                            placeholder="-"
                                                            value={final}
                                                            onChange={(e) => handleGradeChange(enrollment.id, 'final', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {enrollment.letter_grade ? (
                                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-xs font-bold border ${['AA', 'BA', 'BB', 'CB', 'CC'].includes(enrollment.letter_grade)
                                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                                }`}>
                                                                {enrollment.letter_grade}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {enrollment.status === 'completed' && (
                                                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                                                        )}
                                                        {enrollment.status === 'failed' && (
                                                            <AlertCircle className="w-5 h-5 text-red-500 mx-auto" />
                                                        )}
                                                        {enrollment.status === 'enrolled' && (
                                                            <div className="w-2 h-2 bg-blue-400 rounded-full mx-auto"></div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
