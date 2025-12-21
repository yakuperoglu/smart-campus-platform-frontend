/**
 * Admin Schedule Generator Page
 * 
 * Generate course schedules using CSP algorithm.
 */

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';

export default function SchedulingPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useContext(AuthContext);

    const [semester, setSemester] = useState('Spring');
    const [year, setYear] = useState(new Date().getFullYear());
    const [previewOnly, setPreviewOnly] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [schedulingInfo, setSchedulingInfo] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user && user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }
        fetchSchedulingInfo();
    }, [user, authLoading]);

    const fetchSchedulingInfo = async () => {
        try {
            const response = await api.get('/scheduling/info');
            setSchedulingInfo(response.data.data);
        } catch (err) {
            console.error('Failed to fetch scheduling info:', err);
        }
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            setError(null);
            setResult(null);
            setProgress(0);

            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + Math.random() * 15;
                });
            }, 500);

            const response = await api.post('/scheduling/generate', {
                semester,
                year,
                preview_only: previewOnly
            });

            clearInterval(progressInterval);
            setProgress(100);

            setResult({
                success: response.data.data?.success,
                statistics: response.data.data?.statistics,
                assignments: response.data.data?.assignments || [],
                unassigned: response.data.data?.unassigned || [],
                message: previewOnly
                    ? 'Preview generated successfully! Review the results below.'
                    : 'Schedule generated and saved successfully!'
            });

        } catch (err) {
            console.error('Generation error:', err);
            setError(err.response?.data?.message || 'Schedule generation failed');
        } finally {
            setGenerating(false);
        }
    };

    const handleClearSchedule = async () => {
        if (!confirm(`Are you sure you want to clear the ${semester} ${year} schedule? This cannot be undone.`)) {
            return;
        }

        try {
            await api.delete('/scheduling/schedule', {
                data: { semester, year }
            });
            setResult(null);
            setError(null);
            alert('Schedule cleared successfully');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to clear schedule');
        }
    };

    if (authLoading) {
        return (
            <>
                <Head><title>Schedule Generator - Admin</title></Head>
                <Navbar />
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p>Loading...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Schedule Generator - Admin Portal</title>
            </Head>
            <Navbar />

            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>🗓️ Schedule Generator</h1>
                        <p style={styles.subtitle}>Generate course schedules using CSP algorithm</p>
                    </div>
                </div>

                {/* Info Cards */}
                {schedulingInfo && (
                    <div style={styles.infoGrid}>
                        <div style={styles.infoCard}>
                            <span style={styles.infoValue}>{schedulingInfo.totalSections || 0}</span>
                            <span style={styles.infoLabel}>Sections</span>
                        </div>
                        <div style={styles.infoCard}>
                            <span style={styles.infoValue}>{schedulingInfo.totalClassrooms || 0}</span>
                            <span style={styles.infoLabel}>Classrooms</span>
                        </div>
                        <div style={styles.infoCard}>
                            <span style={styles.infoValue}>{schedulingInfo.totalInstructors || 0}</span>
                            <span style={styles.infoLabel}>Instructors</span>
                        </div>
                        <div style={styles.infoCard}>
                            <span style={styles.infoValue}>{schedulingInfo.timeSlots || 0}</span>
                            <span style={styles.infoLabel}>Time Slots</span>
                        </div>
                    </div>
                )}

                {/* Generator Form */}
                <div style={styles.formCard}>
                    <h2 style={styles.formTitle}>Configuration</h2>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Semester</label>
                            <select
                                value={semester}
                                onChange={(e) => setSemester(e.target.value)}
                                style={styles.select}
                                disabled={generating}
                            >
                                <option value="Fall">Fall</option>
                                <option value="Spring">Spring</option>
                                <option value="Summer">Summer</option>
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Year</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                style={styles.select}
                                disabled={generating}
                            >
                                {[2024, 2025, 2026, 2027].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={styles.toggleRow}>
                        <label style={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                checked={previewOnly}
                                onChange={(e) => setPreviewOnly(e.target.checked)}
                                style={styles.checkbox}
                                disabled={generating}
                            />
                            <span style={styles.toggleText}>Preview Only</span>
                        </label>
                        <span style={styles.toggleHint}>
                            {previewOnly
                                ? 'Dry run - results will not be saved'
                                : 'Results will be saved to database'}
                        </span>
                    </div>

                    {/* Constraints Info */}
                    <div style={styles.constraintsBox}>
                        <h3 style={styles.constraintsTitle}>📋 Scheduling Constraints</h3>
                        <ul style={styles.constraintsList}>
                            <li>No instructor double-booking</li>
                            <li>No classroom conflicts</li>
                            <li>Respect classroom capacity</li>
                            <li>Honor instructor time preferences</li>
                            <li>Lab sections in lab rooms</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div style={styles.actionRow}>
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            style={{
                                ...styles.generateBtn,
                                opacity: generating ? 0.6 : 1
                            }}
                        >
                            {generating ? 'Generating...' : '🚀 Generate Schedule'}
                        </button>
                        <button
                            onClick={handleClearSchedule}
                            disabled={generating}
                            style={styles.clearBtn}
                        >
                            🗑️ Clear Schedule
                        </button>
                    </div>
                </div>

                {/* Progress */}
                {generating && (
                    <div style={styles.progressCard}>
                        <div style={styles.progressHeader}>
                            <div style={styles.spinner}></div>
                            <span>Generating schedule using CSP algorithm...</span>
                        </div>
                        <div style={styles.progressBar}>
                            <div
                                style={{ ...styles.progressFill, width: `${progress}%` }}
                            ></div>
                        </div>
                        <p style={styles.progressText}>
                            This may take a few minutes depending on the number of sections.
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={styles.errorCard}>
                        <span style={styles.errorIcon}>⚠️</span>
                        <div>
                            <h3 style={styles.errorTitle}>Generation Failed</h3>
                            <p style={styles.errorMessage}>{error}</p>
                        </div>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div style={styles.resultCard}>
                        <div style={styles.resultHeader}>
                            <span style={styles.resultIcon}>{result.success ? '✓' : '⚠️'}</span>
                            <h2 style={styles.resultTitle}>
                                {result.success ? 'Schedule Generated' : 'Partial Success'}
                            </h2>
                        </div>

                        <p style={styles.resultMessage}>{result.message}</p>

                        {/* Statistics */}
                        {result.statistics && (
                            <div style={styles.statsGrid}>
                                <div style={styles.statCard}>
                                    <span style={styles.statValue}>{result.statistics.assigned || 0}</span>
                                    <span style={styles.statLabel}>Assigned</span>
                                </div>
                                <div style={styles.statCard}>
                                    <span style={{ ...styles.statValue, color: result.statistics.unassigned > 0 ? '#EF4444' : '#10B981' }}>
                                        {result.statistics.unassigned || 0}
                                    </span>
                                    <span style={styles.statLabel}>Unassigned</span>
                                </div>
                                <div style={styles.statCard}>
                                    <span style={styles.statValue}>{result.statistics.conflicts || 0}</span>
                                    <span style={styles.statLabel}>Conflicts</span>
                                </div>
                                <div style={styles.statCard}>
                                    <span style={styles.statValue}>
                                        {result.statistics.duration ? `${(result.statistics.duration / 1000).toFixed(1)}s` : '-'}
                                    </span>
                                    <span style={styles.statLabel}>Duration</span>
                                </div>
                            </div>
                        )}

                        {/* Unassigned Sections */}
                        {result.unassigned && result.unassigned.length > 0 && (
                            <div style={styles.unassignedSection}>
                                <h3 style={styles.unassignedTitle}>⚠️ Unassigned Sections</h3>
                                <div style={styles.unassignedList}>
                                    {result.unassigned.map((item, idx) => (
                                        <div key={idx} style={styles.unassignedItem}>
                                            <span>{item.section || item.course_code}</span>
                                            <span style={styles.unassignedReason}>{item.reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Preview Note */}
                        {previewOnly && result.success && (
                            <div style={styles.previewNote}>
                                <p>This is a preview. To save the schedule, uncheck "Preview Only" and generate again.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Algorithm Info */}
                <div style={styles.infoSection}>
                    <h3 style={styles.infoTitle}>ℹ️ About the Algorithm</h3>
                    <p style={styles.infoText}>
                        The schedule generator uses a <strong>Constraint Satisfaction Problem (CSP)</strong> approach
                        with backtracking and heuristics to find optimal room and time assignments for all course sections.
                    </p>
                    <ul style={styles.infoList}>
                        <li><strong>MRV Heuristic:</strong> Most Restricted Variable - assigns hardest sections first</li>
                        <li><strong>LCV Heuristic:</strong> Least Constraining Value - picks slots that leave most options</li>
                        <li><strong>Arc Consistency:</strong> Prunes impossible assignments early</li>
                    </ul>
                </div>
            </div>

            <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </>
    );
}

const styles = {
    container: {
        maxWidth: '900px',
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
        marginBottom: '24px'
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
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
    },
    infoCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    },
    infoValue: {
        display: 'block',
        fontSize: '28px',
        fontWeight: '700',
        color: '#8B5CF6'
    },
    infoLabel: {
        fontSize: '13px',
        color: '#6B7280'
    },
    formCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        marginBottom: '24px'
    },
    formTitle: {
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '20px',
        color: '#111827'
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '20px'
    },
    formGroup: {},
    formLabel: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px'
    },
    select: {
        width: '100%',
        padding: '12px 16px',
        border: '1px solid #E5E7EB',
        borderRadius: '10px',
        fontSize: '15px',
        backgroundColor: 'white'
    },
    toggleRow: {
        marginBottom: '20px'
    },
    toggleLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer'
    },
    checkbox: {
        width: '18px',
        height: '18px',
        accentColor: '#8B5CF6'
    },
    toggleText: {
        fontSize: '15px',
        fontWeight: '500',
        color: '#374151'
    },
    toggleHint: {
        display: 'block',
        fontSize: '13px',
        color: '#9CA3AF',
        marginTop: '4px',
        marginLeft: '28px'
    },
    constraintsBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px'
    },
    constraintsTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '12px'
    },
    constraintsList: {
        margin: 0,
        paddingLeft: '20px',
        fontSize: '13px',
        color: '#6B7280',
        lineHeight: '1.8'
    },
    actionRow: {
        display: 'flex',
        gap: '12px'
    },
    generateBtn: {
        flex: 1,
        padding: '16px',
        backgroundColor: '#8B5CF6',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    clearBtn: {
        padding: '16px 24px',
        backgroundColor: '#FEF2F2',
        color: '#DC2626',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    progressCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        marginBottom: '24px'
    },
    progressHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px'
    },
    progressBar: {
        height: '8px',
        backgroundColor: '#E5E7EB',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '12px'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#8B5CF6',
        borderRadius: '4px',
        transition: 'width 0.3s'
    },
    progressText: {
        fontSize: '13px',
        color: '#6B7280'
    },
    errorCard: {
        display: 'flex',
        gap: '16px',
        backgroundColor: '#FEF2F2',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px'
    },
    errorIcon: {
        fontSize: '32px'
    },
    errorTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#991B1B',
        marginBottom: '4px'
    },
    errorMessage: {
        fontSize: '14px',
        color: '#DC2626'
    },
    resultCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        marginBottom: '24px'
    },
    resultHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
    },
    resultIcon: {
        fontSize: '32px'
    },
    resultTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#111827'
    },
    resultMessage: {
        fontSize: '15px',
        color: '#6B7280',
        marginBottom: '24px'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '24px'
    },
    statCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: '10px',
        padding: '16px',
        textAlign: 'center'
    },
    statValue: {
        display: 'block',
        fontSize: '24px',
        fontWeight: '700',
        color: '#10B981'
    },
    statLabel: {
        fontSize: '12px',
        color: '#6B7280'
    },
    unassignedSection: {
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#FEF3C7',
        borderRadius: '12px'
    },
    unassignedTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#92400E',
        marginBottom: '12px'
    },
    unassignedList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    unassignedItem: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '13px',
        color: '#78350F'
    },
    unassignedReason: {
        color: '#92400E'
    },
    previewNote: {
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#EFF6FF',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#1E40AF'
    },
    infoSection: {
        backgroundColor: '#F9FAFB',
        borderRadius: '16px',
        padding: '24px'
    },
    infoTitle: {
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '12px',
        color: '#111827'
    },
    infoText: {
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#4B5563',
        marginBottom: '16px'
    },
    infoList: {
        margin: 0,
        paddingLeft: '20px',
        fontSize: '13px',
        color: '#6B7280',
        lineHeight: '1.8'
    }
};

// Force SSR to prevent static generation errors
export async function getServerSideProps() {
    return { props: {} };
}
