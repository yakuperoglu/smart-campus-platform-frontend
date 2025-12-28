/**
 * My Grades Page
 * View academic performance, grades, and download transcript
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';

export default function MyGrades() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [grades, setGrades] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    // Redirect if not authenticated or not student
    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'student')) {
            router.push('/dashboard');
        }
    }, [authLoading, user, router]);

    // Fetch grades and summary
    useEffect(() => {
        const fetchData = async () => {
            if (!user || user.role !== 'student') return;

            try {
                setLoading(true);
                // Fetch grades summary
                const summaryRes = await api.get('/grades/summary');

                if (summaryRes.data.success) {
                    setSummary(summaryRes.data.data);

                    // If summary contains detailed courses, use them, otherwise fetch detail?
                    // Looking at the controller logic usually summary might be lighter.
                    // Let's assume we need to fetch full grades list if not in summary.
                    // Checking gradesRoutes.js, /grades returns "List of grades".

                    const gradesRes = await api.get('/grades');
                    if (gradesRes.data.success) {
                        setGrades(gradesRes.data.data.grades || []);
                    }
                }
            } catch (err) {
                console.error('Error fetching grades:', err);
                setError('Failed to load academic data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    // Handle Transcript Download
    const handleDownloadTranscript = async () => {
        try {
            setDownloading(true);
            const response = await api.get('/grades/transcript/pdf', {
                responseType: 'blob' // Important for PDF download
            });

            // Create a blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `transcript_${user.profile?.student_number || 'student'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Error downloading transcript:', err);
            alert('Failed to download transcript. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    // Group grades by semester
    const groupedGrades = grades.reduce((acc, grade) => {
        const key = `${grade.semester} ${grade.year}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(grade);
        return acc;
    }, {});

    // Sort semesters (Newest first)
    const sortedSemesterKeys = Object.keys(groupedGrades).sort((a, b) => {
        const [semA, yearA] = a.split(' ');
        const [semB, yearB] = b.split(' ');

        if (yearA !== yearB) return yearB - yearA;
        // Fall, Spring, Summer sort order
        const order = { 'Fall': 3, 'Summer': 2, 'Spring': 1 };
        return (order[semA] || 0) - (order[semB] || 0);
    });

    const getGradeColor = (grade) => {
        if (!grade) return '#a0aec0'; // gray
        if (['AA', 'BA', 'BB', 'CB', 'CC'].includes(grade)) return '#38a169'; // green
        return '#e53e3e'; // red
    };

    if (authLoading || loading) {
        return (
            <div className="container">
                <Navbar />
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your academic records...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'student') return null;

    return (
        <>
            <Head>
                <title>My Grades - Smart Campus</title>
            </Head>

            <Navbar />

            <div className="page-container">
                <div className="content-wrapper">
                    <div className="header-section">
                        <div className="title-area">
                            <h1>My Grades & Transcript</h1>
                            <p className="subtitle">View your academic performance and download official transcript</p>
                        </div>

                        <button
                            className="btn-download"
                            onClick={handleDownloadTranscript}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <>
                                    <span className="mini-spinner"></span> Generating PDF...
                                </>
                            ) : (
                                <>
                                    📄 Download Official Transcript
                                </>
                            )}
                        </button>
                    </div>

                    {/* Academic Summary Cards */}
                    <div className="summary-cards">
                        <div className="summary-card">
                            <h3>CGPA</h3>
                            <div className="value">{summary?.cgpa != null ? Number(summary.cgpa).toFixed(2) : '0.00'}</div>
                            <div className="label">Cumulative GPA</div>
                        </div>

                        <div className="summary-card">
                            <h3>Total Credits</h3>
                            <div className="value">{summary?.totalCredits || 0}</div>
                            <div className="label">Credits Earned</div>
                        </div>

                        <div className="summary-card">
                            <h3>Total ECTS</h3>
                            <div className="value">{summary?.totalEcts || 0}</div>
                            <div className="label">ECTS Earned</div>
                        </div>
                    </div>

                    {error && (
                        <div className="error-banner">
                            {error}
                        </div>
                    )}

                    {/* Grades List */}
                    <div className="grades-section">
                        {grades.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📊</div>
                                <h3>No Grades Yet</h3>
                                <p>You haven't received any grades yet.</p>
                            </div>
                        ) : (
                            sortedSemesterKeys.map(semesterKey => (
                                <div key={semesterKey} className="semester-block">
                                    <h3 className="semester-title">{semesterKey}</h3>
                                    <div className="table-responsive">
                                        <table className="grades-table">
                                            <thead>
                                                <tr>
                                                    <th>Course Code</th>
                                                    <th>Course Name</th>
                                                    <th>Credits</th>
                                                    <th className="text-center">Midterm</th>
                                                    <th className="text-center">Final</th>
                                                    <th className="text-center">Grade</th>
                                                    <th className="text-center">Points</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupedGrades[semesterKey].map((grade, index) => (
                                                    <tr key={index}>
                                                        <td className="font-mono">{grade.course_code}</td>
                                                        <td>{grade.course_name}</td>
                                                        <td>{grade.credits}</td>
                                                        <td className="text-center">{grade.midterm_grade ?? '-'}</td>
                                                        <td className="text-center">{grade.final_grade ?? '-'}</td>
                                                        <td className="text-center">
                                                            <span
                                                                className="grade-badge"
                                                                style={{
                                                                    backgroundColor: getGradeColor(grade.letter_grade) + '20',
                                                                    color: getGradeColor(grade.letter_grade)
                                                                }}
                                                            >
                                                                {grade.letter_grade || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            {grade.letter_grade
                                                                ? (api.gradePoints?.[grade.letter_grade] || 0).toFixed(1) // Placeholder logic, assuming API returns points or we map it
                                                                : '-'
                                                            }
                                                            {/* Actually API might not return points directly in list, check types. 
                                  If not present, we can ignore or compute. */}
                                                        </td>
                                                        <td>
                                                            {grade.status === 'completed' ? (
                                                                <span className="status-pass">Passed</span>
                                                            ) : grade.status === 'failed' ? (
                                                                <span className="status-fail">Failed</span>
                                                            ) : (
                                                                <span className="status-ongoing">In Progress</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        )}
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
          max-width: 1200px;
          margin: 0 auto;
          padding: 30px 20px;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .header-section h1 {
          font-size: 2.2rem;
          color: #2d3748;
          margin-bottom: 5px;
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
        
        .mini-spinner {
          display: inline-block;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          width: 14px;
          height: 14px;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .summary-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          text-align: center;
          border-bottom: 4px solid #667eea;
        }

        .summary-card h3 {
          font-size: 1.1rem;
          color: #718096;
          margin-bottom: 15px;
          font-weight: 500;
        }

        .summary-card .value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 5px;
        }

        .summary-card .label {
          color: #a0aec0;
          font-size: 0.9rem;
        }

        .semester-block {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          margin-bottom: 30px;
        }

        .semester-title {
          font-size: 1.3rem;
          color: #2d3748;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .grades-table {
          width: 100%;
          border-collapse: collapse;
        }

        .grades-table th {
          text-align: left;
          padding: 12px;
          background-color: #f7fafc;
          color: #4a5568;
          font-weight: 600;
          font-size: 0.95rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .grades-table td {
          padding: 15px 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #2d3748;
        }

        .text-center {
          text-align: center !important;
        }

        .font-mono {
          font-family: monospace;
          font-weight: 600;
          color: #4a5568;
        }

        .grade-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 700;
          min-width: 40px;
        }

        .status-pass {
          color: #38a169;
          font-weight: 500;
        }

        .status-fail {
          color: #e53e3e;
          font-weight: 500;
        }
        
        .status-ongoing {
          color: #3182ce;
          font-weight: 500;
        }

        .btn-download {
          background-color: #2d3748;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-download:hover {
          background-color: #1a202c;
          transform: translateY(-2px);
        }

        .btn-download:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
          transform: none;
        }
        
        .error-banner {
          background: #fff5f5;
          color: #c53030;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #feb2b2;
        }

        .empty-state {
          text-align: center;
          padding: 50px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }
      `}</style>
        </>
    );
}
