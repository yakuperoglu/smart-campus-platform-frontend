import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
    Calendar,
    Settings,
    Play,
    Trash2,
    AlertTriangle,
    CheckCircle,
    Clock,
    Layout,
    Users,
    Info,
    RefreshCw
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
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
    }, [user, authLoading, router]);

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

    if (authLoading || !user || user.role !== 'admin') return null;

    return (
        <DashboardLayout user={user}>
            <Head>
                <title>Schedule Generator | Admin | Smart Campus</title>
            </Head>

            <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Calendar className="h-6 w-6 text-indigo-600" />
                            Schedule Generator
                        </h1>
                        <p className="mt-1 text-gray-500">Generate optimized course schedules using CSP algorithm</p>
                    </div>
                </div>

                {/* Info Cards */}
                {schedulingInfo && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <span className="block text-2xl font-bold text-indigo-600">{schedulingInfo.totalSections || 0}</span>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sections</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <span className="block text-2xl font-bold text-indigo-600">{schedulingInfo.totalClassrooms || 0}</span>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Classrooms</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <span className="block text-2xl font-bold text-indigo-600">{schedulingInfo.totalInstructors || 0}</span>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Instructors</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <span className="block text-2xl font-bold text-indigo-600">{schedulingInfo.timeSlots || 0}</span>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time Slots</span>
                        </div>
                    </div>
                )}

                {/* Generator Configuration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-gray-500" />
                            Configuration
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                <select
                                    value={semester}
                                    onChange={(e) => setSemester(e.target.value)}
                                    disabled={generating}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="Fall">Fall</option>
                                    <option value="Spring">Spring</option>
                                    <option value="Summer">Summer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                    disabled={generating}
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={previewOnly}
                                        onChange={(e) => setPreviewOnly(e.target.checked)}
                                        disabled={generating}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </div>
                                <span className="font-medium text-gray-900">Preview Only Mode</span>
                            </label>
                            <span className="text-sm text-gray-500 hidden sm:inline-block">
                                {previewOnly ? 'Running dry run without saving changes' : 'Generated schedule will be saved to database'}
                            </span>
                        </div>

                        {/* Constraints Info */}
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                            <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                Active Constraints
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-indigo-700">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-indigo-500" /> No instructor double-booking
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-indigo-500" /> No classroom conflicts
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-indigo-500" /> Respect classroom capacity
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-indigo-500" /> Lab sections in lab rooms
                                </li>
                            </ul>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 ${generating
                                        ? 'bg-indigo-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:translate-y-[-1px] hover:shadow-xl'
                                    }`}
                            >
                                {generating ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-5 w-5 fill-current" />
                                        Generate Schedule
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleClearSchedule}
                                disabled={generating}
                                className="px-4 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-medium border border-red-100 transition-colors"
                                title="Clear Schedule"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {generating && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Running CSP Algorithm...</span>
                            <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            This process usually takes 5-30 seconds depending on complexity.
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3 animate-in shake">
                        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold">Generation Failed</h3>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Results Section */}
                {result && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <h2 className={`text-lg font-bold flex items-center gap-2 ${result.success ? 'text-green-700' : 'text-amber-600'}`}>
                                    {result.success ? <CheckCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                                    {result.success ? 'Schedule Generated Successfully' : 'Completed with Conflicts'}
                                </h2>
                            </div>

                            <div className="p-6">
                                <p className="text-gray-600 mb-6">{result.message}</p>

                                {/* Statistics Grid */}
                                {result.statistics && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-green-50 p-4 rounded-xl text-center">
                                            <span className="block text-2xl font-bold text-green-700">{result.statistics.scheduled_sections || 0}</span>
                                            <span className="text-xs font-semibold text-green-600 uppercase">Assigned</span>
                                        </div>
                                        <div className={`p-4 rounded-xl text-center ${result.statistics.unscheduled_sections > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                                            <span className={`block text-2xl font-bold ${result.statistics.unscheduled_sections > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                                                {result.statistics.unscheduled_sections || 0}
                                            </span>
                                            <span className={`text-xs font-semibold uppercase ${result.statistics.unscheduled_sections > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                Unassigned
                                            </span>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-xl text-center">
                                            <span className="block text-2xl font-bold text-blue-700">{result.statistics.backtrack_count || 0}</span>
                                            <span className="text-xs font-semibold text-blue-600 uppercase">Backtracks</span>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-xl text-center">
                                            <span className="block text-2xl font-bold text-purple-700">
                                                {result.statistics.duration_ms ? `${(result.statistics.duration_ms / 1000).toFixed(2)}s` : '-'}
                                            </span>
                                            <span className="text-xs font-semibold text-purple-600 uppercase">Duration</span>
                                        </div>
                                    </div>
                                )}

                                {/* Unassigned List */}
                                {result.unassigned && result.unassigned.length > 0 && (
                                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                        <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            Unassigned Sections Impact Report
                                        </h3>
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                            {result.unassigned.map((item, idx) => (
                                                <div key={idx} className="flex items-start justify-between bg-white p-3 rounded-lg border border-amber-100/50 shadow-sm text-sm">
                                                    <span className="font-semibold text-gray-900">{item.section || item.course_code}</span>
                                                    <span className="text-amber-700">{item.reason}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {previewOnly && result.success && (
                                    <div className="mt-6 flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 p-3 rounded-lg">
                                        <Info className="h-4 w-4" />
                                        This is a preview. Uncheck "Preview Only" and generate again to save changes.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
