/**
 * My Courses Page
 * View and manage enrolled courses for students
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';
import {
  BookOpen,
  Search,
  Calendar,
  Clock,
  Users,
  PlusCircle,
  MinusCircle,
  ChevronRight,
  GraduationCap,
  School
} from 'lucide-react';

export default function MyCourses() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
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
    if (!scheduleData) return <span className="text-gray-400 italic">TBA</span>;

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
      <div key={index} className="flex items-center gap-1.5 text-sm text-gray-600">
        <Calendar className="h-3.5 w-3.5 text-blue-500" />
        <span>{slot.day}</span>
        <Clock className="h-3.5 w-3.5 text-blue-500 ml-1" />
        <span>{slot.start_time} - {slot.end_time}</span>
        {slot.classroom && (
          <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
            {slot.classroom}
          </span>
        )}
      </div>
    ));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'student') return null;

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <Head>
        <title>My Courses | Smart Campus</title>
      </Head>

      <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              My Enrolled Courses
            </h1>
            <p className="mt-1 text-gray-500">View and manage your current semester courses</p>
          </div>
        </div>

        {message.text && (
          <FeedbackMessage
            type={message.type}
            message={message.text}
            onClose={() => setMessage({ type: '', text: '' })}
          />
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Enrolled Courses */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gray-500" />
                Enrolled Courses
              </h2>
              <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                {courses.length} Active
              </span>
            </div>

            {courses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-blue-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Enrolled Courses</h3>
                <p className="text-gray-500">You are not currently enrolled in any courses.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((enrollment) => {
                  const section = enrollment.section || {};
                  // Backend returns course and section separately, not section.course
                  const course = enrollment.course || section.course || {};

                  return (
                    <div key={enrollment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <School className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 leading-tight">{course.name || 'Unknown Course'}</h3>
                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs font-semibold">{course.code || 'N/A'}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>{course.credits || 0} Credits</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>Sec {section.section_number || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${enrollment.status === 'enrolled' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {enrollment.status}
                        </span>
                      </div>

                      <div className="border-t border-gray-100 pt-4 mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Schedule</div>
                        <div className="space-y-1">
                          {formatSchedule(section.schedule || section.schedule_json)}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => router.push(`/courses/${course.id}`)}
                          className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <ChevronRight className="h-4 w-4" />
                          Details
                        </button>
                        <button
                          onClick={() => handleDropCourse(enrollment.id, course.code)}
                          disabled={droppingId === enrollment.id}
                          className="flex-1 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {droppingId === enrollment.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <MinusCircle className="h-4 w-4" />
                          )}
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit sticky top-6 flex flex-col max-h-[calc(100vh-100px)]">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                <PlusCircle className="h-5 w-5 text-indigo-600" />
                Add More Courses
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search available courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {loadingAvailable ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading courses...</p>
                </div>
              ) : availableCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p>No available courses found.</p>
                </div>
              ) : (
                availableCourses.map((course) => (
                  <div key={course.id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{course.code}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{course.credits} Credits</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1" title={course.name}>{course.name}</h4>
                        {course.department && (
                          <p className="text-xs text-gray-500">{course.department.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {course.sections.map((section) => (
                        <div key={section.id} className="bg-gray-50 p-2.5 rounded-lg flex items-center justify-between group-hover:bg-white transition-colors">
                          <div className="text-xs space-y-1">
                            <div className="font-semibold text-gray-700">Section {section.section_number}</div>
                            <div className="text-gray-500">{section.available_seats} seats left</div>
                            <div className="pt-1">{formatSchedule(section.schedule)}</div>
                          </div>
                          <button
                            onClick={() => handleEnroll(section.id, course.name, section.section_number)}
                            disabled={enrollingId === section.id || section.available_seats <= 0}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                          >
                            {enrollingId === section.id ? '...' : (section.available_seats <= 0 ? 'Full' : 'Enroll')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
