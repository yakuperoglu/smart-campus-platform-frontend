import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

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
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [fetchingCourses, setFetchingCourses] = useState(true);
    const [filters, setFilters] = useState({
        semester: '',
        year: ''
    });

    // Fetch courses from API
    useEffect(() => {
        const fetchCourses = async () => {
            setFetchingCourses(true);
            try {
                const params = new URLSearchParams();
                if (filters.semester) params.append('semester', filters.semester);
                if (filters.year) params.append('year', filters.year);
                if (searchTerm) params.append('search', searchTerm);

                const response = await api.get(`/courses?${params.toString()}`);

                if (response.data.success) {
                    setCourses(response.data.data.courses);
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
        <div className="courses-page" style={{ backgroundColor: '#f7fafc', minHeight: '100vh' }}>
            <Head>
                <title>Course Selection | Smart Campus</title>
            </Head>

            <Navbar userData={user} />

            {/* Global Feedback Component */}
            <FeedbackMessage
                type={feedback.type}
                message={feedback.message}
                onClose={closeFeedback}
            />

            <div className="courses-container">
                <header className="courses-header">
                    <h1>Course Selection</h1>
                    <div className="filters-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
                            <input
                                type="text"
                                placeholder="Search by course code or name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <select
                            value={filters.semester}
                            onChange={(e) => setFilters(f => ({ ...f, semester: e.target.value }))}
                            className="filter-select"
                            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                            <option value="">All Semesters</option>
                            <option value="Fall">Fall</option>
                            <option value="Spring">Spring</option>
                            <option value="Summer">Summer</option>
                        </select>
                        <select
                            value={filters.year}
                            onChange={(e) => setFilters(f => ({ ...f, year: e.target.value }))}
                            className="filter-select"
                            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        >
                            <option value="">All Years</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                        </select>
                    </div>
                </header>

                {fetchingCourses ? (
                    <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
                        <div className="spinner" style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid #e2e8f0',
                            borderTop: '4px solid #4299e1',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 1rem'
                        }}></div>
                        <p>Loading courses...</p>
                        <style jsx>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                ) : (
                    <div className="courses-grid">
                        {displayCourses.length > 0 ? (
                            displayCourses.map(course => (
                                <div key={course.id} className="course-card">
                                    <div className="course-header">
                                        <div className="course-code">{course.code}</div>
                                        <h2 className="course-title">{course.name}</h2>
                                        <div className="course-credits">{course.credits} Credits</div>
                                    </div>
                                    <div className="course-body">
                                        <p className="course-description">{course.description || 'No description available.'}</p>

                                        <div className="sections-list">
                                            <h4>Available Sections</h4>
                                            {course.sections.map((section) => (
                                                <div key={section.id} className="section-item">
                                                    <div className="section-info">
                                                        <span className="section-number">Section {section.section_number}</span>
                                                        <span className="section-schedule">{formatSchedule(section.schedule)}</span>
                                                        <span className="section-instructor" style={{ fontSize: '0.8em', color: '#888' }}>
                                                            {section.instructor?.name || 'TBA'}
                                                        </span>
                                                        <span className="section-capacity" style={{ fontSize: '0.75em', color: section.available_seats > 0 ? '#38a169' : '#e53e3e' }}>
                                                            {section.available_seats > 0
                                                                ? `${section.available_seats} seats available`
                                                                : 'Section Full'
                                                            }
                                                        </span>
                                                    </div>
                                                    <button
                                                        className={`enroll-btn ${section.is_enrolled ? 'enrolled' : ''}`}
                                                        onClick={() => handleEnroll(section.id, course.code, section.section_number)}
                                                        disabled={loading || section.is_enrolled || section.available_seats <= 0}
                                                        style={{
                                                            opacity: (section.is_enrolled || section.available_seats <= 0) ? 0.7 : 1,
                                                            cursor: (section.is_enrolled || section.available_seats <= 0) ? 'not-allowed' : 'pointer',
                                                            backgroundColor: section.is_enrolled ? '#38a169' : undefined
                                                        }}
                                                    >
                                                        {loading ? '...' : section.is_enrolled ? '✓ Enrolled' : section.available_seats <= 0 ? 'Full' : 'Enroll'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">
                                <h3>
                                    {searchTerm
                                        ? `No courses found matching "${searchTerm}"`
                                        : 'No courses available with sections'
                                    }
                                </h3>
                                <p style={{ color: '#718096', marginTop: '0.5rem' }}>
                                    Try adjusting your filters or search term.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
