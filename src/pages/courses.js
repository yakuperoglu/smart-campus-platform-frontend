import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, BookOpen, Clock, User, AlertCircle } from 'lucide-react';

// Helper to format schedule from JSON array
const formatSchedule = (scheduleJson) => {
    if (!scheduleJson || !Array.isArray(scheduleJson) || scheduleJson.length === 0) {
        return 'TBA';
    }
    return scheduleJson
        .map(slot => `${slot.day} ${slot.start_time}-${slot.end_time}`)
        .join(', ');
};

export default function Courses() {
    const { user, logout } = useAuth();
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [fetchingCourses, setFetchingCourses] = useState(true);
    const [filters, setFilters] = useState({
        semester: '', // Start with empty to show all sections
        year: '' // Start with empty to show all sections
    });

    // Fetch courses from API
    useEffect(() => {
        const fetchCourses = async () => {
            setFetchingCourses(true);
            try {
                const params = new URLSearchParams();
                // Only send filters if they have values (not empty strings)
                if (filters.semester && filters.semester.trim() !== '') {
                    params.append('semester', filters.semester);
                }
                if (filters.year && filters.year.toString().trim() !== '') {
                    params.append('year', filters.year);
                }
                if (searchTerm && searchTerm.trim() !== '') {
                    params.append('search', searchTerm);
                }

                const response = await api.get(`/courses?${params.toString()}`);

                if (response.data.success) {
                    const coursesData = response.data.data.courses || [];
                    setCourses(coursesData);

                    // Show helpful message if no courses
                    if (coursesData.length === 0 && !searchTerm && !filters.semester && !filters.year) {
                        setFeedback({
                            type: 'info',
                            message: 'No courses found. Make sure the database has been seeded with courses and sections.'
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
                setFeedback({
                    type: 'error',
                    message: 'Failed to load courses. Please try again.'
                });
            } finally {
                setFetchingCourses(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(fetchCourses, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, filters.semester, filters.year]);

    const handleEnroll = async (sectionId, courseName, sectionNumber) => {
        setLoading(true);
        setFeedback({ type: 'loading', message: `Enrolling in ${courseName} - Section ${sectionNumber}...` });

        try {
            const response = await api.post('/enrollments', {
                section_id: sectionId
            });

            setFeedback({
                type: 'success',
                message: `Successfully enrolled in ${courseName} (Section ${sectionNumber})!`
            });

            // Refresh courses to update enrollment counts
            const coursesResponse = await api.get('/courses');
            if (coursesResponse.data.success) {
                setCourses(coursesResponse.data.data.courses);
            }

        } catch (error) {
            console.error('Enrollment error:', error);

            let errorMessage = 'Failed to enroll. Please try again.';

            if (error.response) {
                const data = error.response.data;

                if (data.error && data.error.message) {
                    errorMessage = data.error.message;
                } else if (data.message) {
                    errorMessage = typeof data.message === 'object' ? JSON.stringify(data.message) : String(data.message);
                } else if (Array.isArray(data.errors)) {
                    errorMessage = data.errors.map(e => e.msg || JSON.stringify(e)).join(', ');
                }

                // Check for specific known error types
                if (errorMessage.includes('Prerequisite') || data.error?.code === 'PREREQUISITES_NOT_MET') {
                    errorMessage = `⚠️ Prerequisite Error: ${errorMessage}`;
                } else if (errorMessage.includes('Conflict') || data.error?.code === 'SCHEDULE_CONFLICT') {
                    errorMessage = `⚠️ Schedule Conflict: ${errorMessage}`;
                } else if (data.error?.code === 'SECTION_FULL') {
                    errorMessage = `⚠️ Section Full: ${errorMessage}`;
                } else if (data.error?.code === 'ALREADY_ENROLLED') {
                    errorMessage = `⚠️ Already Enrolled: ${errorMessage}`;
                }
            }

            setFeedback({
                type: 'error',
                message: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    const closeFeedback = () => {
        setFeedback({ type: '', message: '' });
    };

    // Filter courses that have at least one section (if no filters applied, show all)
    const displayCourses = courses.filter(course =>
        course.sections && course.sections.length > 0
    );

    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>Course Selection | Smart Campus</title>
            </Head>

            {/* Global Feedback Component */}
            <FeedbackMessage
                type={feedback.type}
                message={feedback.message}
                onClose={closeFeedback}
            />

            <div className="mb-6 animate-in slide-in-from-bottom-2 duration-500">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Course Selection</h1>
                <p className="text-gray-500 mt-1">Browse available courses and manage your enrollment.</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center mb-8 animate-in slide-in-from-bottom-3 duration-500 delay-75">
                <div className="flex-1 w-full">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Search className="h-4 w-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by course code or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                        />
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                            value={filters.semester}
                            onChange={(e) => setFilters(f => ({ ...f, semester: e.target.value }))}
                            className="block w-full pl-9 pr-10 py-2 text-sm border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg border appearance-none"
                        >
                            <option value="">All Semesters</option>
                            <option value="Fall">Fall</option>
                            <option value="Spring">Spring</option>
                            <option value="Summer">Summer</option>
                        </select>
                    </div>
                    <select
                        value={filters.year}
                        onChange={(e) => setFilters(f => ({ ...f, year: e.target.value }))}
                        className="block w-full md:w-auto pl-3 pr-8 py-2 text-sm border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg border appearance-none"
                    >
                        <option value="">All Years</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                    </select>
                </div>
            </div>

            {fetchingCourses ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading courses...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-5 duration-500 delay-100">
                    {displayCourses.length > 0 ? (
                        displayCourses.map(course => (
                            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200 group">
                                <div className="p-5 border-b border-gray-100 flex flex-col h-full relative">
                                    <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <BookOpen className="h-24 w-24 text-gray-900" />
                                    </div>

                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                            {course.code}
                                        </span>
                                        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{course.credits} Credits</span>
                                    </div>

                                    <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 relative z-10">{course.name}</h2>
                                    <p className="text-gray-600 text-xs line-clamp-3 mb-4 flex-grow relative z-10 leading-relaxed">{course.description || 'No description available.'}</p>

                                    <div className="mt-auto relative z-10">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            Available Sections
                                        </h4>
                                        <div className="space-y-2">
                                            {course.sections.map((section) => (
                                                <div key={section.id} className="bg-gray-50/80 backdrop-blur-sm rounded-lg p-3 border border-gray-100 hover:border-gray-200 transition-colors">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <span className="text-sm font-bold text-gray-900 block">Section {section.section_number}</span>
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                                                                <Clock className="h-3 w-3" />
                                                                <span>{formatSchedule(section.schedule)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`text-[10px] font-bold block ${section.available_seats > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {section.available_seats > 0 ? `${section.available_seats} Seats` : 'Full'}
                                                            </span>
                                                            <div className="flex items-center gap-1 justify-end text-[10px] text-gray-400 mt-0.5 max-w-[100px] truncate">
                                                                <User className="h-3 w-3" />
                                                                <span>{section.instructor?.name || 'TBA'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className={`w-full flex justify-center py-1.5 px-3 border border-transparent rounded-md text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all
                                                            ${section.is_enrolled
                                                                ? 'bg-green-100 text-green-800 border-green-200 cursor-default'
                                                                : section.available_seats <= 0
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-slate-900 text-white hover:bg-black hover:shadow-md active:transform active:scale-95'
                                                            }`}
                                                        onClick={() => !section.is_enrolled && section.available_seats > 0 && handleEnroll(section.id, course.code, section.section_number)}
                                                        disabled={loading || section.is_enrolled || section.available_seats <= 0}
                                                    >
                                                        {loading && !section.is_enrolled ? 'Processing...' : section.is_enrolled ? '✓ Enrolled' : section.available_seats <= 0 ? 'Waitlist Full' : 'Enroll'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-16 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 text-gray-400">
                                <Search className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">
                                {searchTerm
                                    ? `No courses found matching "${searchTerm}"`
                                    : filters.semester || filters.year
                                        ? `No courses for ${filters.semester || 'selected semester'} ${filters.year || 'selected year'}`
                                        : 'No courses available'
                                }
                            </h3>
                            <p className="mt-2 text-gray-500 max-w-sm mx-auto text-sm">
                                {filters.semester || filters.year
                                    ? `Try adjusting your filters to see more results.`
                                    : 'Please contact your administrator to set up the course catalog.'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}

