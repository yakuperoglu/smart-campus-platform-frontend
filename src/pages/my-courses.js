/**
 * My Courses Page
 * View and manage enrolled courses for students
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';

export default function MyCourses() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [courses, setCourses] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAvailable, setLoadingAvailable] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [droppingId, setDroppingId] = useState(null);
    const [enrollingId, setEnrollingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Redirect if not authenticated or not student
    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'student')) {
            router.push('/dashboard');
        }
    }, [authLoading, user, router]);

    // Fetch enrollments
    useEffect(() => {
        const fetchCourses = async () => {
            if (!user || user.role !== 'student') return;

            try {
                setLoading(true);
                // Default to showing 'enrolled' status courses
                const response = await api.get('/enrollments?status=enrolled');

                if (response.data.success) {
                    setCourses(response.data.data.enrollments || []);
                }
            } catch (err) {
                console.error('Error fetching courses:', err);
                setError('Failed to load your courses. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [user]);

    // Fetch available courses
    useEffect(() => {
        const fetchAvailableCourses = async () => {
            if (!user || user.role !== 'student') return;

            try {
                setLoadingAvailable(true);
                const params = new URLSearchParams();
                params.append('semester', 'Spring');
                params.append('year', '2024');
                if (searchTerm && searchTerm.trim() !== '') {
                    params.append('search', searchTerm);
                }

                const response = await api.get(`/courses?${params.toString()}`);

                if (response.data.success) {
                    const allCourses = response.data.data.courses || [];
                    
                    // Filter out courses that are already enrolled
                    const enrolledSectionIds = new Set(
                        courses.map(e => e.section?.id).filter(Boolean)
                    );
                    
                    const filtered = allCourses.map(course => ({
                        ...course,
                        sections: course.sections.filter(
                            section => !enrolledSectionIds.has(section.id)
                        )
                    })).filter(course => course.sections.length > 0);
                    
                    setAvailableCourses(filtered);
                }
            } catch (err) {
                console.error('Error fetching available courses:', err);
            } finally {
                setLoadingAvailable(false);
            }
        };

        fetchAvailableCourses();
    }, [user, searchTerm, courses]);

    // Handle course drop
    const handleDropCourse = async (enrollmentId, courseName) => {
        if (!window.confirm(`Are you sure you want to drop ${courseName}? This action cannot be undone.`)) {
            return;
        }

        try {
            setDroppingId(enrollmentId);
            setMessage({ type: '', text: '' });

            const response = await api.delete(`/enrollments/${enrollmentId}`);

            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: `Successfully dropped ${courseName}.`
                });

                // Remove dropped course from list
                setCourses(courses.filter(c => c.id !== enrollmentId));
            }
        } catch (err) {
            console.error('Error dropping course:', err);
            setMessage({
                type: 'error',
                text: err.response?.data?.error?.message || 'Failed to drop course. Please try again.'
            });
        } finally {
            setDroppingId(null);
        }
    };

    // Handle course enrollment
    const handleEnroll = async (sectionId, courseName, sectionNumber) => {
        try {
            setEnrollingId(sectionId);
            setMessage({ type: '', text: '' });

            const response = await api.post('/enrollments', {
                section_id: sectionId
            });

            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: `Successfully enrolled in ${courseName} (Section ${sectionNumber})!`
                });

                // Refresh enrolled courses
                const enrollmentsResponse = await api.get('/enrollments?status=enrolled');
                if (enrollmentsResponse.data.success) {
                    const enrollments = enrollmentsResponse.data.data.enrollments || [];
                    console.log('Refreshed enrollments:', enrollments); // Debug
                    setCourses(enrollments);
                }
            }
        } catch (err) {
            console.error('Enrollment error:', err);
            let errorMessage = 'Failed to enroll. Please try again.';
            
            if (err.response?.data?.error) {
                const error = err.response.data.error;
                if (error.code === 'PREREQUISITES_NOT_MET') {
                    errorMessage = 'Prerequisites not met. Please complete required courses first.';
                } else if (error.code === 'SCHEDULE_CONFLICT') {
                    errorMessage = 'Schedule conflict detected. Please choose a different section.';
                } else if (error.code === 'SECTION_FULL') {
                    errorMessage = 'This section is full. Please choose another section.';
                } else if (error.code === 'ALREADY_ENROLLED' || error.code === 'ALREADY_ENROLLED_IN_COURSE') {
                    errorMessage = 'You are already enrolled in this course or section.';
                } else if (error.message) {
                    errorMessage = error.message;
                }
            }
            
            setMessage({
                type: 'error',
                text: errorMessage
            });
        } finally {
            setEnrollingId(null);
        }
    };

    // Format schedule text from JSON
    const formatSchedule = (scheduleData) => {
        if (!scheduleData) return 'TBA';

        let schedule = scheduleData;
        if (typeof schedule === 'string') {
            try {
                schedule = JSON.parse(schedule);
            } catch (e) {
                return scheduleData;
            }
        }

        if (!Array.isArray(schedule)) {
            schedule = [schedule];
        }

        return schedule.map((slot, index) => (
            <div key={index} className="schedule-slot">
                {slot.day} {slot.start_time} - {slot.end_time}
                {slot.classroom && <span className="classroom-tag"> ({slot.classroom})</span>}
            </div>
        ));
    };

    if (authLoading || loading) {
        return (
            <div className="container">
                <Navbar />
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your courses...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'student') return null;

    return (
        <>
            <Head>
                <title>My Courses - Smart Campus</title>
            </Head>

            <Navbar />

            <div className="page-container">
                <div className="content-wrapper">
                    <div className="header-section">
                        <h1>My Enrolled Courses</h1>
                        <p className="subtitle">View and manage your current semester courses</p>
                    </div>

                    {message.text && (
                        <FeedbackMessage
                            type={message.type}
                            message={message.text}
                            onClose={() => setMessage({ type: '', text: '' })}
                        />
                    )}

                    {error && (
                        <div className="error-banner">
                            {error}
                        </div>
                    )}

                    <div className="two-column-layout">
                        {/* Left Column: Enrolled Courses */}
                        <div className="left-column">
                            <h2 className="section-title">Enrolled Courses</h2>
                            
                            {courses.length === 0 && !loading && !error ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📚</div>
                                    <h3>No Enrolled Courses</h3>
                                    <p>You are not currently enrolled in any courses.</p>
                                </div>
                            ) : (
                                <div className="courses-grid">
                                    {courses.map((enrollment) => {
                                        const section = enrollment.section || {};
                                        // Backend returns course and section separately, not section.course
                                        const course = enrollment.course || section.course || {};

                                        return (
                                            <div key={enrollment.id} className="course-card">
                                                <div className="course-header">
                                                    <div className="course-code-badge">{course.code || 'N/A'}</div>
                                                    <div className="credits-badge">{course.credits || 0} Credits</div>
                                                </div>

                                                <h3 className="course-title">{course.name || 'Unknown Course'}</h3>

                                                <div className="course-info">
                                                    <div className="info-item">
                                                        <span className="label">Section:</span>
                                                        <span className="value">{section.section_number || 'N/A'}</span>
                                                    </div>

                                                    <div className="info-item">
                                                        <span className="label">Schedule:</span>
                                                        <div className="value schedule-container">
                                                            {formatSchedule(section.schedule || section.schedule_json)}
                                                        </div>
                                                    </div>

                                                    <div className="info-item">
                                                        <span className="label">Status:</span>
                                                        <span className={`status-badge ${enrollment.status}`}>
                                                            {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="card-actions">
                                                    <button
                                                        className="btn-outline"
                                                        onClick={() => router.push(`/courses/${course.id}`)}
                                                    >
                                                        View Details
                                                    </button>

                                                    <button
                                                        className="btn-danger"
                                                        onClick={() => handleDropCourse(enrollment.id, course.code)}
                                                        disabled={droppingId === enrollment.id}
                                                    >
                                                        {droppingId === enrollment.id ? 'Dropping...' : 'Drop Course'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Available Courses */}
                        <div className="right-column">
                            <h2 className="section-title">Add More Courses</h2>
                            
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                            </div>

                            {loadingAvailable ? (
                                <div className="loading-state-small">
                                    <div className="spinner-small"></div>
                                    <p>Loading courses...</p>
                                </div>
                            ) : availableCourses.length === 0 ? (
                                <div className="empty-state-small">
                                    <p>No available courses found.</p>
                                </div>
                            ) : (
                                <div className="available-courses-list">
                                    {availableCourses.map((course) => (
                                        <div key={course.id} className="available-course-card">
                                            <div className="available-course-header">
                                                <div className="course-code-small">{course.code}</div>
                                                <div className="credits-small">{course.credits} Credits</div>
                                            </div>
                                            <h4 className="course-name-small">{course.name}</h4>
                                            {course.department && (
                                                <p className="department-name">{course.department.name}</p>
                                            )}
                                            
                                            {course.sections.map((section) => (
                                                <div key={section.id} className="section-item">
                                                    <div className="section-info">
                                                        <span className="section-label">Section {section.section_number}</span>
                                                        <span className="schedule-text">
                                                            {formatSchedule(section.schedule)}
                                                        </span>
                                                        <span className="seats-info">
                                                            {section.available_seats} seats available
                                                        </span>
                                                    </div>
                                                    <button
                                                        className="btn-enroll"
                                                        onClick={() => handleEnroll(section.id, course.name, section.section_number)}
                                                        disabled={enrollingId === section.id}
                                                    >
                                                        {enrollingId === section.id ? 'Enrolling...' : 'Enroll'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .page-container {
          min-height: 100vh;
          background-color: #f5f7fa;
          padding-bottom: 50px;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 30px 20px;
        }

        .two-column-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-top: 30px;
        }

        .left-column,
        .right-column {
          display: flex;
          flex-direction: column;
        }

        .section-title {
          font-size: 1.5rem;
          color: #2d3748;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .search-box {
          margin-bottom: 20px;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .available-courses-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          max-height: calc(100vh - 300px);
          overflow-y: auto;
          padding-right: 10px;
        }

        .available-course-card {
          background: white;
          border-radius: 10px;
          padding: 18px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }

        .available-course-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .course-code-small {
          background: #ebf8ff;
          color: #2b6cb0;
          padding: 4px 10px;
          border-radius: 15px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .credits-small {
          background: #f7fafc;
          color: #718096;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
        }

        .course-name-small {
          font-size: 1rem;
          color: #2d3748;
          margin-bottom: 5px;
          font-weight: 600;
        }

        .department-name {
          font-size: 0.85rem;
          color: #718096;
          margin-bottom: 12px;
        }

        .section-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #f7fafc;
          border-radius: 6px;
          margin-top: 8px;
        }

        .section-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .section-label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #4a5568;
        }

        .schedule-text {
          font-size: 0.85rem;
          color: #718096;
        }

        .seats-info {
          font-size: 0.8rem;
          color: #48bb78;
          font-weight: 500;
        }

        .btn-enroll {
          background: #667eea;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .btn-enroll:hover:not(:disabled) {
          background: #5a67d8;
        }

        .btn-enroll:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }

        .loading-state-small {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .spinner-small {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }

        .empty-state-small {
          text-align: center;
          padding: 40px;
          color: #718096;
        }

        @media (max-width: 1024px) {
          .two-column-layout {
            grid-template-columns: 1fr;
          }
          
          .available-courses-list {
            max-height: 500px;
          }
        }

        .header-section {
          margin-bottom: 30px;
        }

        .header-section h1 {
          font-size: 2.2rem;
          color: #2d3748;
          margin-bottom: 10px;
        }

        .subtitle {
          color: #718096;
          font-size: 1.1rem;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          background: white;
          padding: 50px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          color: #2d3748;
          margin-bottom: 10px;
        }

        .empty-state p {
          color: #718096;
          margin-bottom: 25px;
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 25px;
        }

        .course-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
        }

        .course-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px rgba(0,0,0,0.1);
        }

        .course-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .course-code-badge {
          background: #ebf8ff;
          color: #2b6cb0;
          padding: 5px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .credits-badge {
          background: #f7fafc;
          color: #718096;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 0.85rem;
        }

        .course-title {
          font-size: 1.25rem;
          color: #2d3748;
          margin-bottom: 20px;
          line-height: 1.4;
          flex-grow: 1;
        }

        .course-info {
          margin-bottom: 25px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
        }

        .info-item {
          display: flex;
          margin-bottom: 10px;
          align-items: flex-start;
        }

        .info-item .label {
          min-width: 80px;
          color: #718096;
          font-size: 0.9rem;
        }

        .info-item .value {
          color: #4a5568;
          font-weight: 500;
          font-size: 0.95rem;
        }

        .schedule-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .status-badge {
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .status-badge.enrolled {
          background: #def7ec;
          color: #03543f;
        }

        .status-badge.dropped {
          background: #fde8e8;
          color: #9b1c1c;
        }

        .card-actions {
          display: flex;
          gap: 15px;
          margin-top: auto;
        }

        .card-actions button {
          flex: 1;
          padding: 10px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-primary:hover {
          background: #5a67d8;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #4a5568;
        }

        .btn-outline:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
        }

        .btn-danger {
          background: white;
          border: 1px solid #fed7d7;
          color: #e53e3e;
        }

        .btn-danger:hover {
          background: #fff5f5;
          border-color: #fc8181;
        }

        .btn-danger:disabled {
          background: #edf2f7;
          color: #a0aec0;
          border-color: #cbd5e0;
          cursor: not-allowed;
        }

        .error-banner {
          background: #fff5f5;
          color: #c53030;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #feb2b2;
        }

        @media (max-width: 640px) {
          .courses-grid {
            grid-template-columns: 1fr;
          }
          
          .card-actions {
            flex-direction: column;
          }
        }
      `}</style>
        </>
    );
}
