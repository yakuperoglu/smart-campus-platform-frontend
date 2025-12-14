import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

// MOCK DATA - Backend doesn't support listing courses for students yet
const VALID_SECTION_ID = '50514101-9c60-474c-8fa2-632341902263';

const MOCK_COURSES = [
    {
        id: '1',
        code: 'CE101',
        name: 'Introduction to Programming',
        description: 'Fundamentals of programming using Python',
        credits: 4,
        sections: [
            { id: VALID_SECTION_ID, section_number: 1, schedule: 'Mon/Wed 09:00-10:30', instructor: 'Dr. Smith', capacity: 50, enrolled: 0 },
            { id: VALID_SECTION_ID, section_number: 2, schedule: 'Tue/Thu 11:00-12:30', instructor: 'Prof. Johnson', capacity: 30, enrolled: 28 }
        ]
    },
    {
        id: '2',
        code: 'MATH101',
        name: 'Calculus I',
        description: 'Differential calculus',
        credits: 4,
        sections: [
            { id: VALID_SECTION_ID, section_number: 1, schedule: 'Mon/Wed/Fri 10:00-11:00', instructor: 'Dr. Brown', capacity: 40, enrolled: 10 }
        ]
    },
    {
        id: '3',
        code: 'ENG102',
        name: 'Academic Writing',
        description: 'Development of critical thinking and writing skills.',
        credits: 3,
        sections: [
            { id: VALID_SECTION_ID, section_number: 1, schedule: 'Mon 14:00-17:00', instructor: 'Ms. Davis', capacity: 25, enrolled: 20 },
            { id: VALID_SECTION_ID, section_number: 2, schedule: 'Wed 14:00-17:00', instructor: 'Ms. Davis', capacity: 25, enrolled: 22 }
        ]
    },
    {
        id: '4',
        code: 'PHYS101',
        name: 'Physics I',
        description: 'Mechanics, heat, and sound.',
        credits: 4,
        sections: [
            { id: VALID_SECTION_ID, section_number: 1, schedule: 'Tue/Thu 09:00-11:00', instructor: 'Dr. Einstein', capacity: 50, enrolled: 45 }
        ]
    }
];

export default function Courses() {
    const { user } = useAuth();
    const [courses, setCourses] = useState(MOCK_COURSES);
    const [searchTerm, setSearchTerm] = useState('');
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    // Filter courses based on search
    useEffect(() => {
        const results = MOCK_COURSES.filter(course =>
            course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setCourses(results);
    }, [searchTerm]);

    const handleEnroll = async (sectionId, courseName, sectionNumber) => {
        setLoading(true);
        setFeedback({ type: 'loading', message: `Enrolling in ${courseName} - Section ${sectionNumber}...` });

        try {
            // Use REAL backend endpoint for enrollment
            const response = await api.post('/enrollments', {
                section_id: sectionId
            });

            setFeedback({
                type: 'success',
                message: `Successfully enrolled in ${courseName} (Section ${sectionNumber})!`
            });

        } catch (error) {
            console.error('Enrollment error:', error);

            let errorMessage = 'Failed to enroll. Please try again.';

            // Handle specific backend errors
            if (error.response) {
                const data = error.response.data;

                // Safely extract error message regardless of format (string, object, array)
                if (data.message) {
                    errorMessage = typeof data.message === 'object' ? JSON.stringify(data.message) : String(data.message);
                } else if (data.error) {
                    errorMessage = typeof data.error === 'object' ? JSON.stringify(data.error) : String(data.error);
                } else if (Array.isArray(data.errors)) {
                    // Handle array of validation errors
                    errorMessage = data.errors.map(e => e.msg || JSON.stringify(e)).join(', ');
                }

                // Check for specific known error types
                if (errorMessage.includes('Prerequisite')) {
                    errorMessage = `⚠️ Prerequisite Error: ${errorMessage}`;
                } else if (errorMessage.includes('Conflict')) {
                    errorMessage = `⚠️ Schedule Conflict: ${errorMessage}`;
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
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search by course code or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </header>

                <div className="courses-grid">
                    {courses.length > 0 ? (
                        courses.map(course => (
                            <div key={course.id} className="course-card">
                                <div className="course-header">
                                    <div className="course-code">{course.code}</div>
                                    <h2 className="course-title">{course.name}</h2>
                                    <div className="course-credits">{course.credits} Credits</div>
                                </div>
                                <div className="course-body">
                                    <p className="course-description">{course.description}</p>

                                    <div className="sections-list">
                                        <h4>Available Sections</h4>
                                        {course.sections.map((section, idx) => (
                                            <div key={idx} className="section-item">
                                                <div className="section-info">
                                                    <span className="section-number">Section {section.section_number}</span>
                                                    <span className="section-schedule">{section.schedule}</span>
                                                    <span className="section-instructor" style={{ fontSize: '0.8em', color: '#888' }}>{section.instructor}</span>
                                                </div>
                                                <button
                                                    className="enroll-btn"
                                                    onClick={() => handleEnroll(section.id, course.code, section.section_number)}
                                                    disabled={loading}
                                                >
                                                    {loading ? '...' : 'Enroll'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-results">
                            <h3>No courses found matching "{searchTerm}"</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
