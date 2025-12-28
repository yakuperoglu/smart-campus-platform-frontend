/**

 * My Schedule Page

 * 

 * Weekly course schedule view using FullCalendar.

 */



import { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import DashboardLayout from '../components/layout/DashboardLayout';
import { AuthContext } from '../context/AuthContext';
import api from '../config/api';
import scheduleService from '../services/scheduleService';



// Dynamic import for ScheduleCalendar (SSR disabled)
const ScheduleCalendar = dynamic(
    () => import('../components/ScheduleCalendar'),
    { ssr: false, loading: () => <div style={styles.calendarLoading}>Loading calendar...</div> }
);

export default function SchedulePage() {
    const router = useRouter();
    const { user, logout, loading: authLoading } = useContext(AuthContext);

    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [semester, setSemester] = useState('Fall');
    const [year, setYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState('week');

    useEffect(() => {
        if (!authLoading) {
            fetchSchedule();
        }
    }, [user, authLoading, semester, year]);



    const fetchSchedule = async () => {

        try {

            setLoading(true);

            const response = await api.get(`/scheduling/schedule?semester=${semester}&year=${year}`);

            setSchedule(response.data.data || []);

            setError(null);

        } catch (err) {

            console.error('Error fetching schedule:', err);

            if (err.response?.status !== 401) {

                setError('Failed to load schedule');

            }

            setSchedule([]);

        } finally {

            setLoading(false);

        }

    };



    // Convert backend schedule to FullCalendar events

    const mapToCalendarEvents = useCallback(() => {

        const dayMapping = {

            'Monday': 1,

            'Tuesday': 2,

            'Wednesday': 3,

            'Thursday': 4,

            'Friday': 5,

            'Saturday': 6,

            'Sunday': 0

        };



        // Get current week's dates

        const today = new Date();

        const startOfWeek = new Date(today);

        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday



        return schedule.map(item => {

            const dayIndex = dayMapping[item.day] || dayMapping[item.day_of_week] || 1;

            const eventDate = new Date(startOfWeek);

            eventDate.setDate(startOfWeek.getDate() + dayIndex);



            const startTime = item.start_time?.substring(0, 5) || '09:00';

            const endTime = item.end_time?.substring(0, 5) || '10:00';



            // Get event color based on course type or section

            const color = getEventColor(item);



            return {

                id: item.id,

                title: formatEventTitle(item),

                start: `${eventDate.toISOString().split('T')[0]}T${startTime}`,

                end: `${eventDate.toISOString().split('T')[0]}T${endTime}`,

                backgroundColor: color,

                borderColor: color,

                textColor: '#ffffff',

                extendedProps: {

                    courseCode: item.section?.course_code || item.course_code,

                    courseName: item.section?.course_name || item.course_name,

                    sectionNumber: item.section?.section_number || item.section_number,

                    instructor: item.section?.instructor?.name || item.instructor,

                    classroom: formatClassroom(item),

                    type: item.section?.type || item.type || 'lecture'

                }

            };

        });

    }, [schedule]);



    const formatEventTitle = (item) => {

        const code = item.section?.course_code || item.course_code || '';

        const section = item.section?.section_number || item.section_number || '';

        return `${code}${section ? ` - ${section}` : ''}`;

    };



    const formatClassroom = (item) => {

        if (item.classroom) {

            return `${item.classroom.building || ''} ${item.classroom.room_number || ''}`.trim();

        }

        return item.room || 'TBA';

    };



    const getEventColor = (item) => {

        // Color by course type

        const type = item.section?.type || item.type || 'lecture';

        const typeColors = {

            lecture: '#3B82F6',    // Blue

            lab: '#10B981',        // Green

            seminar: '#8B5CF6',    // Purple

            tutorial: '#F59E0B',   // Amber

            workshop: '#EC4899',   // Pink

            recitation: '#6366F1'  // Indigo

        };



        if (typeColors[type.toLowerCase()]) {

            return typeColors[type.toLowerCase()];

        }



        // Fallback: Generate color from course code
        const code = item.section?.course_code || item.course_code || '';
        const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6', '#F97316'];
        const index = code ? code.charCodeAt(0) % colors.length : 0;
        return colors[index];
    };

    const handleExportICal = async () => {
        try {
            await scheduleService.exportToIcal();
        } catch (err) {
            console.error('Export error:', err);
            setError('Failed to export calendar');
        }
    };



    const formatICalDate = (date) => {

        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    };



    const calendarEvents = mapToCalendarEvents();



    if (authLoading) {
        return (
            <DashboardLayout user={user} onLogout={logout}>
                <Head><title>My Schedule - Smart Campus</title></Head>
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p>Loading...</p>
                </div>
            </DashboardLayout>
        );
    }



    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Head>
                <title>My Schedule - Smart Campus</title>
                <style>{`
          .fc {
            font-family: system-ui, -apple-system, sans-serif;
          }
          .fc-toolbar-title {
            font-size: 1.25rem !important;
            font-weight: 600 !important;
          }
          .fc-button {
            padding: 0.5rem 1rem !important;
            font-size: 0.875rem !important;
            border-radius: 8px !important;
          }
          .fc-button-primary {
            background-color: #8B5CF6 !important;
            border-color: #8B5CF6 !important;
          }
          .fc-button-primary:not(:disabled).fc-button-active,
          .fc-button-primary:not(:disabled):active {
            background-color: #7C3AED !important;
          }
          .fc-event {
            border-radius: 6px !important;
            padding: 2px 6px !important;
            font-size: 0.75rem !important;
            cursor: pointer;
          }
          .fc-timegrid-slot {
            height: 3rem !important;
          }
          .fc-col-header-cell {
            padding: 0.75rem 0 !important;
            font-weight: 600 !important;
          }
          @media (max-width: 768px) {
            .fc-toolbar {
              flex-direction: column;
              gap: 0.5rem;
            }
            .fc-toolbar-chunk {
              display: flex;
              justify-content: center;
            }
          }
        `}</style>
            </Head>



            <div style={styles.container}>

                {/* Header */}

                <div style={styles.header}>

                    <div>

                        <h1 style={styles.title}>📅 My Schedule</h1>

                        <p style={styles.subtitle}>{semester} {year} • {schedule.length} classes</p>

                    </div>

                    <button onClick={handleExportICal} style={styles.exportBtn}>

                        📤 Export iCal

                    </button>

                </div>



                {/* Filters */}

                <div style={styles.filters}>

                    <div style={styles.filterGroup}>

                        <label style={styles.filterLabel}>Semester</label>

                        <select

                            value={semester}

                            onChange={(e) => setSemester(e.target.value)}

                            style={styles.select}

                        >

                            <option value="Fall">Fall</option>

                            <option value="Spring">Spring</option>

                            <option value="Summer">Summer</option>

                        </select>

                    </div>

                    <div style={styles.filterGroup}>

                        <label style={styles.filterLabel}>Year</label>

                        <select

                            value={year}

                            onChange={(e) => setYear(parseInt(e.target.value))}

                            style={styles.select}

                        >

                            {[2023, 2024, 2025, 2026].map(y => (

                                <option key={y} value={y}>{y}</option>

                            ))}

                        </select>

                    </div>

                    <div style={styles.viewToggle}>

                        <button

                            onClick={() => setViewMode('week')}

                            style={viewMode === 'week' ? styles.viewBtnActive : styles.viewBtn}

                        >

                            Week

                        </button>

                        <button

                            onClick={() => setViewMode('day')}

                            style={viewMode === 'day' ? styles.viewBtnActive : styles.viewBtn}

                        >

                            Day

                        </button>

                    </div>

                </div>



                {/* Error */}

                {error && (

                    <div style={styles.errorAlert}>

                        {error}

                        <button onClick={() => setError(null)} style={styles.alertClose}>×</button>

                    </div>

                )}



                {/* Legend */}

                <div style={styles.legend}>

                    <span style={styles.legendTitle}>Event Types:</span>

                    <div style={styles.legendItems}>

                        <span style={styles.legendItem}>

                            <span style={{ ...styles.legendDot, backgroundColor: '#3B82F6' }}></span>

                            Lecture

                        </span>

                        <span style={styles.legendItem}>

                            <span style={{ ...styles.legendDot, backgroundColor: '#10B981' }}></span>

                            Lab

                        </span>

                        <span style={styles.legendItem}>

                            <span style={{ ...styles.legendDot, backgroundColor: '#8B5CF6' }}></span>

                            Seminar

                        </span>

                        <span style={styles.legendItem}>

                            <span style={{ ...styles.legendDot, backgroundColor: '#F59E0B' }}></span>

                            Tutorial

                        </span>

                    </div>

                </div>



                {/* Calendar */}

                <div style={styles.calendarCard}>

                    {loading ? (
                        <div style={styles.calendarLoading}>
                            <div style={styles.spinner}></div>
                            <p>Loading schedule...</p>
                        </div>
                    ) : (
                        <ScheduleCalendar
                            viewMode={viewMode}
                            events={calendarEvents}
                            onEventClick={(info) => {
                                const props = info.event.extendedProps;
                                alert(
                                    `${props.courseName || info.event.title}\n\n` +
                                    `📍 Room: ${props.classroom}\n` +
                                    `👨‍🏫 Instructor: ${props.instructor || 'TBA'}\n` +
                                    `📚 Type: ${props.type}`
                                );
                            }}
                        />
                    )}

                </div>



                {/* Schedule Table (Mobile-friendly alternative) */}

                {schedule.length > 0 && (

                    <div style={styles.tableSection}>

                        <h2 style={styles.tableTitle}>Schedule Overview</h2>

                        <div style={styles.tableWrapper}>

                            <table style={styles.table}>

                                <thead>

                                    <tr>

                                        <th style={styles.th}>Course</th>

                                        <th style={styles.th}>Day</th>

                                        <th style={styles.th}>Time</th>

                                        <th style={styles.th}>Room</th>

                                        <th style={styles.th}>Instructor</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {schedule.map(item => (

                                        <tr key={item.id}>

                                            <td style={styles.td}>

                                                <div style={styles.courseCell}>

                                                    <span style={styles.courseCode}>

                                                        {item.section?.course_code || item.course_code}

                                                    </span>

                                                    <span style={styles.courseName}>

                                                        {item.section?.course_name || item.course_name}

                                                    </span>

                                                </div>

                                            </td>

                                            <td style={styles.td}>{item.day || item.day_of_week}</td>

                                            <td style={styles.td}>

                                                {item.start_time?.substring(0, 5)} - {item.end_time?.substring(0, 5)}

                                            </td>

                                            <td style={styles.td}>{formatClassroom(item)}</td>

                                            <td style={styles.td}>

                                                {item.section?.instructor?.name || item.instructor || '-'}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                )}



                {/* Empty State */}

                {!loading && schedule.length === 0 && (

                    <div style={styles.emptyState}>

                        <span style={styles.emptyIcon}>📅</span>

                        <p>No classes scheduled for {semester} {year}</p>

                        <p style={styles.emptyHint}>Schedule will appear once courses are assigned</p>

                    </div>

                )}

            </div>

            <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </DashboardLayout>
    );

}



const styles = {

    container: {

        maxWidth: '1200px',

        margin: '0 auto',

        padding: '24px',

        fontFamily: 'system-ui, -apple-system, sans-serif'

    },

    loadingContainer: {

        display: 'flex',

        flexDirection: 'column',

        alignItems: 'center',

        justifyContent: 'center',

        height: '60vh',

        color: '#6B7280'

    },

    spinner: {

        width: '40px',

        height: '40px',

        border: '3px solid #E5E7EB',

        borderTop: '3px solid #8B5CF6',

        borderRadius: '50%',

        animation: 'spin 1s linear infinite',

        marginBottom: '16px'

    },

    header: {

        display: 'flex',

        justifyContent: 'space-between',

        alignItems: 'flex-start',

        marginBottom: '24px',

        flexWrap: 'wrap',

        gap: '16px'

    },

    title: {

        fontSize: '28px',

        fontWeight: '700',

        color: '#111827',

        margin: 0

    },

    subtitle: {

        fontSize: '16px',

        color: '#6B7280',

        marginTop: '4px'

    },

    exportBtn: {

        display: 'flex',

        alignItems: 'center',

        gap: '8px',

        padding: '12px 20px',

        backgroundColor: '#10B981',

        color: 'white',

        border: 'none',

        borderRadius: '10px',

        fontSize: '14px',

        fontWeight: '600',

        cursor: 'pointer'

    },

    filters: {

        display: 'flex',

        gap: '16px',

        marginBottom: '20px',

        flexWrap: 'wrap',

        alignItems: 'flex-end'

    },

    filterGroup: {

        display: 'flex',

        flexDirection: 'column',

        gap: '4px'

    },

    filterLabel: {

        fontSize: '13px',

        fontWeight: '500',

        color: '#6B7280'

    },

    select: {

        padding: '10px 16px',

        border: '1px solid #E5E7EB',

        borderRadius: '8px',

        fontSize: '14px',

        backgroundColor: 'white',

        minWidth: '120px'

    },

    viewToggle: {

        display: 'flex',

        gap: '4px',

        marginLeft: 'auto'

    },

    viewBtn: {

        padding: '10px 16px',

        backgroundColor: '#F3F4F6',

        border: 'none',

        borderRadius: '8px',

        fontSize: '14px',

        cursor: 'pointer',

        color: '#6B7280'

    },

    viewBtnActive: {

        padding: '10px 16px',

        backgroundColor: '#8B5CF6',

        border: 'none',

        borderRadius: '8px',

        fontSize: '14px',

        cursor: 'pointer',

        color: 'white'

    },

    errorAlert: {

        backgroundColor: '#FEF2F2',

        color: '#DC2626',

        padding: '12px 16px',

        borderRadius: '10px',

        marginBottom: '16px',

        display: 'flex',

        justifyContent: 'space-between'

    },

    alertClose: {

        background: 'none',

        border: 'none',

        fontSize: '18px',

        cursor: 'pointer'

    },

    legend: {

        display: 'flex',

        alignItems: 'center',

        gap: '16px',

        marginBottom: '20px',

        flexWrap: 'wrap'

    },

    legendTitle: {

        fontSize: '13px',

        fontWeight: '500',

        color: '#6B7280'

    },

    legendItems: {

        display: 'flex',

        gap: '16px',

        flexWrap: 'wrap'

    },

    legendItem: {

        display: 'flex',

        alignItems: 'center',

        gap: '6px',

        fontSize: '13px',

        color: '#374151'

    },

    legendDot: {

        width: '12px',

        height: '12px',

        borderRadius: '3px'

    },

    calendarCard: {

        backgroundColor: 'white',

        borderRadius: '16px',

        padding: '24px',

        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',

        marginBottom: '32px',

        minHeight: '500px'

    },

    calendarLoading: {

        display: 'flex',

        flexDirection: 'column',

        alignItems: 'center',

        justifyContent: 'center',

        padding: '80px 20px',

        color: '#6B7280'

    },

    eventContent: {

        padding: '2px',

        overflow: 'hidden'

    },

    eventTitle: {

        fontWeight: '600',

        fontSize: '11px',

        whiteSpace: 'nowrap',

        overflow: 'hidden',

        textOverflow: 'ellipsis'

    },

    eventRoom: {

        fontSize: '10px',

        opacity: 0.9,

        whiteSpace: 'nowrap',

        overflow: 'hidden',

        textOverflow: 'ellipsis'

    },

    tableSection: {

        backgroundColor: 'white',

        borderRadius: '16px',

        padding: '24px',

        boxShadow: '0 4px 16px rgba(0,0,0,0.06)'

    },

    tableTitle: {

        fontSize: '18px',

        fontWeight: '600',

        marginBottom: '16px',

        color: '#111827'

    },

    tableWrapper: {

        overflowX: 'auto'

    },

    table: {

        width: '100%',

        borderCollapse: 'collapse'

    },

    th: {

        textAlign: 'left',

        padding: '12px',

        borderBottom: '2px solid #E5E7EB',

        fontSize: '13px',

        fontWeight: '600',

        color: '#6B7280',

        whiteSpace: 'nowrap'

    },

    td: {

        padding: '14px 12px',

        borderBottom: '1px solid #F3F4F6',

        fontSize: '14px',

        color: '#374151'

    },

    courseCell: {

        display: 'flex',

        flexDirection: 'column',

        gap: '2px'

    },

    courseCode: {

        fontWeight: '600',

        color: '#111827'

    },

    courseName: {

        fontSize: '13px',

        color: '#6B7280'

    },

    emptyState: {

        textAlign: 'center',

        padding: '80px 20px',

        color: '#6B7280'

    },

    emptyIcon: {

        fontSize: '48px',

        display: 'block',

        marginBottom: '16px'

    },

    emptyHint: {

        fontSize: '14px',

        marginTop: '8px',

        opacity: 0.7

    }

};

// Force SSR to prevent static generation errors
export async function getServerSideProps() {
    return { props: {} };
}
