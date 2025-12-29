import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
    QrCode,
    Camera,
    Zap,
    X,
    CheckCircle,
    AlertCircle,
    Copy,
    History,
    Utensils,
    Ticket
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';

export default function StaffScanPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useContext(AuthContext);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const scannerRef = useRef(null); // Assuming this might be used for a library if standard getUserMedia wasn't enough, but sticking to manual implementation per original code

    const [scanMode, setScanMode] = useState('meal'); // 'meal' or 'event'
    const [eventId, setEventId] = useState('');
    const [scanning, setScanning] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [manualCode, setManualCode] = useState('');
    const [cameraError, setCameraError] = useState(null);

    // Redirect logic
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user && !['staff', 'admin', 'faculty'].includes(user.role)) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    const startCamera = useCallback(async () => {
        try {
            setCameraError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setScanning(true);
            }
        } catch (err) {
            console.error('Camera error:', err);
            setCameraError('Unable to access camera. Please use manual entry or check permissions.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setScanning(false);
    }, []);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    const handleScan = async (qrCode) => {
        if (processing || !qrCode) return;

        try {
            setProcessing(true);
            setError(null);
            setResult(null);

            let response;
            let successMessage = '';
            let details = null;

            if (scanMode === 'meal') {
                response = await api.post('/meals/reservations/use', { qr_code: qrCode });
                successMessage = `Reservation confirmed for ${response.data.data?.user?.name || 'User'}`;
                details = response.data.data;
            } else {
                if (!eventId) {
                    throw new Error('Please enter an Event ID first');
                }
                response = await api.post(`/events/${eventId}/checkin`, { qr_code: qrCode });
                successMessage = `${response.data.data?.attendee?.name || 'Attendee'} checked in`;
                details = response.data.data;
            }

            setResult({
                type: 'success',
                title: 'Check-in Successful',
                message: successMessage,
                details
            });

            setScanHistory(prev => [{
                id: Date.now(),
                qrCode: qrCode.substring(0, 20) + '...',
                type: scanMode,
                status: 'success',
                time: new Date().toLocaleTimeString()
            }, ...prev.slice(0, 9)]);

            // Clear result after 3s
            setTimeout(() => setResult(null), 3000);

        } catch (err) {
            console.error('Scan error:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Validation failed';

            setResult({
                type: 'error',
                title: 'Validation Failed',
                message: errorMsg
            });

            setScanHistory(prev => [{
                id: Date.now(),
                qrCode: qrCode.substring(0, 20) + '...',
                type: scanMode,
                status: 'error',
                error: errorMsg,
                time: new Date().toLocaleTimeString()
            }, ...prev.slice(0, 9)]);

            setTimeout(() => setResult(null), 3000);
        } finally {
            setProcessing(false);
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualCode.trim()) {
            handleScan(manualCode.trim());
            setManualCode('');
        }
    };

    if (authLoading || !user) return null;

    return (
        <DashboardLayout user={user}>
            <Head>
                <title>QR Scanner | Staff Portal</title>
            </Head>

            <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-500">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <QrCode className="h-6 w-6 text-blue-600" />
                            QR Scanner
                        </h1>
                        <p className="mt-1 text-gray-500">Validate meal reservations and event tickets</p>
                    </div>
                </div>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setScanMode('meal')}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${scanMode === 'meal'
                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <Utensils className={`h-6 w-6 ${scanMode === 'meal' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="font-semibold">Meal Scan</span>
                    </button>
                    <button
                        onClick={() => setScanMode('event')}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${scanMode === 'event'
                                ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <Ticket className={`h-6 w-6 ${scanMode === 'event' ? 'text-purple-600' : 'text-gray-400'}`} />
                        <span className="font-semibold">Event Check-in</span>
                    </button>
                </div>

                {/* Event ID Input */}
                {scanMode === 'event' && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Event ID</label>
                        <input
                            type="text"
                            value={eventId}
                            onChange={(e) => setEventId(e.target.value)}
                            placeholder="Enter Event ID to validate tickets for..."
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        />
                    </div>
                )}

                {/* Scanner Viewport */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden relative min-h-[320px] flex flex-col">

                    {/* Camera Error */}
                    {cameraError && (
                        <div className="absolute top-4 left-4 right-4 z-20 bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                            <AlertCircle className="h-4 w-4" />
                            {cameraError}
                        </div>
                    )}

                    {/* Scan Result Overlay */}
                    {result && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/95 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="text-center p-6">
                                <div className={`inline-flex items-center justify-center p-4 rounded-full mb-4 ${result.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                    {result.type === 'success' ? <CheckCircle className="h-10 w-10" /> : <X className="h-10 w-10" />}
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${result.type === 'success' ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                    {result.title}
                                </h3>
                                <p className="text-gray-600 max-w-xs mx-auto">
                                    {result.message}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Camera Feed */}
                    {scanning ? (
                        <div className="relative flex-1 bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover absolute inset-0"
                            />
                            {/* Scanning Guide Overlay */}
                            <div className="absolute inset-0 border-[40px] border-black/50 z-10 pointer-events-none">
                                <div className="w-full h-full border-2 border-white/50 rounded-lg relative">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
                                </div>
                            </div>
                            <button
                                onClick={stopCamera}
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-red-600 text-white px-6 py-2 rounded-full shadow-lg font-medium hover:bg-red-700 transition-colors"
                            >
                                Stop Camera
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8 text-center text-gray-500">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Camera className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="mb-6">Camera is currently off</p>
                            <button
                                onClick={startCamera}
                                className="btn-primary-gradient px-6 py-3 flex items-center gap-2"
                            >
                                <Camera className="h-5 w-5" />
                                Start Scanner
                            </button>
                        </div>
                    )}
                </div>

                {/* Manual Entry */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Manual Entry
                    </h3>
                    <form onSubmit={handleManualSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="Paste or type QR content..."
                            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black font-medium disabled:opacity-50"
                        >
                            Validate
                        </button>
                    </form>
                </div>

                {/* History */}
                {scanHistory.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <History className="h-4 w-4 text-gray-500" />
                                Recent Activity
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {scanHistory.map(scan => (
                                <div key={scan.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${scan.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {scan.type === 'meal' ? <Utensils className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 font-mono">
                                                {scan.qrCode}
                                            </p>
                                            <p className="text-xs text-gray-500">{scan.time}</p>
                                        </div>
                                    </div>
                                    <div>
                                        {scan.status === 'success' ? (
                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Success</span>
                                        ) : (
                                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Failed</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}
