import { AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function AttendanceCard({ role, data }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-500" />
                    Attendance Intelligence
                </h3>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live
                </span>
            </div>

            <div className="p-5 flex-1 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-10 -mt-10 opacity-50 blur-2xl"></div>

                {role === 'student' ? (
                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Current Session</span>
                            <span className="font-mono text-xs text-gray-400">#CS101-A</span>
                        </div>
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-50 border-4 border-white shadow-sm mb-2">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <p className="font-bold text-gray-900">Checked In</p>
                            <p className="text-xs text-gray-500">at 09:42 AM via GPS</p>
                        </div>
                        <Link href="/attendance" className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg text-center transition-colors">
                            View History
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-3xl font-bold text-gray-900">42<span className="text-lg text-gray-400 font-normal">/50</span></p>
                                <p className="text-xs text-gray-500 mt-1">Students Present</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                84%
                            </div>
                        </div>

                        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                                <span className="text-xs font-bold text-red-700">Flagged Records (2)</span>
                            </div>
                            <ul className="space-y-1">
                                <li className="text-xs text-red-600 flex justify-between">
                                    <span>John Doe (21001)</span>
                                    <span className="opacity-75">GPS Mismatch</span>
                                </li>
                                <li className="text-xs text-red-600 flex justify-between">
                                    <span>Jane Smith (21045)</span>
                                    <span className="opacity-75">Distance &gt; 50m</span>
                                </li>
                            </ul>
                        </div>

                        <Link href="/admin/analytics/attendance" className="block w-full text-center text-xs font-medium text-gray-500 hover:text-gray-900">
                            View Detailed Report →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
