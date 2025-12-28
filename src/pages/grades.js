/**
 * My Grades Page
 * View academic performance, grades, and download transcript
 * Refactored for SaaS Aesthetic
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';
import { Award, BookOpen, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function MyGrades() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
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
          // Backend returns: data: { student, summary: {totalCredits, totalEcts, cgpa}, ... }
          // We need to extract the nested summary object
          setSummary(summaryRes.data.data.summary);

          const gradesRes = await api.get('/grades');
          if (gradesRes.data.success) {
            // Map nested backend structure to flat structure used by component
            const mappedGrades = (gradesRes.data.data.grades || []).map(g => ({
              semester: g.section.semester,
              year: g.section.year,
              course_code: g.course.code,
              course_name: g.course.name,
              credits: g.course.credits,
              midterm_grade: g.grades.midterm,
              final_grade: g.grades.final,
              letter_grade: g.grades.letter,
              status: g.status
            }));
            setGrades(mappedGrades);
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
      // alert('Failed to download transcript. Please try again.');
      setError('Failed to download transcript. Please try again.');
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
    if (!grade) return 'text-gray-400 bg-gray-100'; // gray
    if (['AA', 'BA', 'BB', 'CB', 'CC'].includes(grade)) return 'text-green-700 bg-green-50 border-green-100'; // green
    return 'text-red-700 bg-red-50 border-red-100'; // red
  };

  if (authLoading || (!user || user.role !== 'student')) {
    return null;
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <Head>
        <title>My Grades - Smart Campus</title>
      </Head>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-in slide-in-from-bottom-2 duration-500">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-blue-600" />
            My Grades & Transcript
          </h1>
          <p className="mt-1 text-gray-500">View your academic performance and download official transcript</p>
        </div>

        <button
          className={`inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-sm text-white bg-slate-900 hover:bg-black transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 ${downloading ? 'opacity-75 cursor-wait' : ''}`}
          onClick={handleDownloadTranscript}
          disabled={downloading}
        >
          {downloading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download Official Transcript
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-sm">Loading academic records...</p>
        </div>
      ) : (
        <>
          {/* Academic Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 animate-in slide-in-from-bottom-3 duration-500 delay-100">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Award className="h-16 w-16 text-blue-600" />
              </div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cumulative GPA</h3>
              <div className="text-4xl font-black text-gray-900 mb-1 tracking-tight">
                {summary?.cgpa != null ? Number(summary.cgpa).toFixed(2) : '0.00'}
              </div>
              <div className="inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Out of 4.00
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BookOpen className="h-16 w-16 text-green-600" />
              </div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Credits</h3>
              <div className="text-4xl font-black text-gray-900 mb-1 tracking-tight">
                {summary?.totalCredits || 0}
              </div>
              <div className="inline-flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                Credits Earned
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Award className="h-16 w-16 text-purple-600" />
              </div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total ECTS</h3>
              <div className="text-4xl font-black text-gray-900 mb-1 tracking-tight">
                {summary?.totalEcts || 0}
              </div>
              <div className="inline-flex items-center text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                ECTS Earned
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 mb-6 border border-red-100 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Grades List */}
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 delay-200">
            {grades.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Grades Published</h3>
                <p className="text-gray-500 max-w-sm mx-auto text-sm">You haven&apos;t received any grades yet. Once your instructors publish them, they will appear here.</p>
              </div>
            ) : (
              sortedSemesterKeys.map(semesterKey => (
                <div key={semesterKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{semesterKey} Semester</h3>
                    <div className="text-xs font-medium text-gray-400">
                      {groupedGrades[semesterKey].length} Courses
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-white">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Credits</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Midterm</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Final</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-50">
                        {groupedGrades[semesterKey].map((grade, index) => (
                          <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900">{grade.course_code}</span>
                                <span className="text-xs text-gray-500">{grade.course_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-600">
                              {grade.credits}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                              {grade.midterm_grade ?? '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                              {grade.final_grade ?? '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold border ${getGradeColor(grade.letter_grade)}`}>
                                {grade.letter_grade || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {grade.status === 'completed' ? (
                                <span className="inline-flex items-center gap-1.5 text-green-700 font-bold text-xs bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Passed
                                </span>
                              ) : grade.status === 'failed' ? (
                                <span className="inline-flex items-center gap-1.5 text-red-700 font-bold text-xs bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Failed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-blue-700 font-bold text-xs bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                  <Clock className="w-3.5 h-3.5" />
                                  In Progress
                                </span>
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
        </>
      )}
    </DashboardLayout>
  );
}
