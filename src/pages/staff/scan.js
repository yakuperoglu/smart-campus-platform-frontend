/**
 * Staff QR Scanner Page
 * 
 * Scan QR codes for meal pickup validation and event check-in.
 */

import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';

export default function StaffScanPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useContext(AuthContext);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const scannerRef = useRef(null);

    const [scanMode, setScanMode] = useState('meal'); // 'meal' or 'event'
    const [eventId, setEventId] = useState('');
    const [scanning, setScanning] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [manualCode, setManualCode] = useState('');
    const [cameraError, setCameraError] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        // Check if user has staff/admin role
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

            if (scanMode === 'meal') {
                // Validate meal reservation
                response = await api.post('/meals/reservations/use', { qr_code: qrCode });
                setResult({
                    type: 'success',
                    title: '✓ Meal Validated',
                    message: `Reservation confirmed for ${response.data.data?.user?.name || 'User'}`,
                    details: response.data.data
                });
            } else {
                // Event check-in
                if (!eventId) {
                    setError('Please enter an event ID first');
                    setProcessing(false);
                    return;
                }
                response = await api.post(`/events/${eventId}/checkin`, { qr_code: qrCode });
                setResult({
                    type: 'success',
                    title: '✓ Check-in Successful',
                    message: `${response.data.data?.attendee?.name || 'Attendee'} checked in`,
                    details: response.data.data
                });
            }

            // Add to history
            setScanHistory(prev => [{
                id: Date.now(),
                qrCode: qrCode.substring(0, 20) + '...',
                type: scanMode,
                status: 'success',
                time: new Date().toLocaleTimeString()
            }, ...prev.slice(0, 9)]);

            // Auto-clear result after delay
            setTimeout(() => {
                setResult(null);
            }, 3000);

        } catch (err) {
            console.error('Scan error:', err);
            const errorMsg = err.response?.data?.message || 'Validation failed';

            setResult({
                type: 'error',
                title: '✗ Validation Failed',
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

            setTimeout(() => {
                setResult(null);
            }, 3000);
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

    if (authLoading) {
        return (
            <>
                <Head><title>QR Scanner - Smart Campus</title></Head>
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
                <title>QR Scanner - Staff Portal</title>
            </Head>
            <Navbar />

            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.title}>📱 QR Scanner</h1>
                    <p style={styles.subtitle}>Validate meal reservations and event tickets</p>
                </div>

                {/* Mode Toggle */}
                <div style={styles.modeToggle}>
                    <button
                        onClick={() => setScanMode('meal')}
                        style={scanMode === 'meal' ? styles.modeBtnActive : styles.modeBtn}
                    >
                        🍽️ Meal Scan
                    </button>
                    <button
                        onClick={() => setScanMode('event')}
                        style={scanMode === 'event' ? styles.modeBtnActive : styles.modeBtn}
                    >
                        🎫 Event Check-in
                    </button>
                </div>

                {/* Event Selector (for event mode) */}
                {scanMode === 'event' && (
                    <div style={styles.eventSelector}>
                        <label style={styles.selectorLabel}>Event ID:</label>
                        <input
                            type="text"
                            value={eventId}
                            onChange={(e) => setEventId(e.target.value)}
                            placeholder="Enter Event ID"
                            style={styles.selectorInput}
                        />
                    </div>
                )}

                {/* Scanner Card */}
                <div style={styles.scannerCard}>
                    {cameraError && (
                        <div style={styles.cameraError}>
                            <span>📷 {cameraError}</span>
                        </div>
                    )}

                    {result && (
                        <div style={{
                            ...styles.resultBox,
                            backgroundColor: result.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                            borderColor: result.type === 'success' ? '#10B981' : '#EF4444'
                        }}>
                            <div style={styles.resultIcon}>
                                {result.type === 'success' ? '✓' : '✗'}
                            </div>
                            <h3 style={{
                                ...styles.resultTitle,
                                color: result.type === 'success' ? '#065F46' : '#991B1B'
                            }}>
                                {result.title}
                            </h3>
                            <p style={styles.resultMessage}>{result.message}</p>
                        </div>
                    )}

                    {processing && (
                        <div style={styles.processingOverlay}>
                            <div style={styles.spinner}></div>
                            <p>Validating...</p>
                        </div>
                    )}

                    {/* Camera Controls */}
                    <div style={styles.cameraControls}>
                        {!scanning ? (
                            <button onClick={startCamera} style={styles.startCameraBtn}>
                                📷 Start Camera
                            </button>
                        ) : (
                            <button onClick={stopCamera} style={styles.stopCameraBtn}>
                                ⏹️ Stop Camera
                            </button>
                        )}
                    </div>

                    {/* Video Preview */}
                    {scanning && (
                        <div style={styles.videoContainer}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                style={styles.video}
                            />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>
                    )}
                </div>

                {/* Manual Entry */}
                <div style={styles.manualSection}>
                    <h3 style={styles.manualTitle}>Manual QR Entry</h3>
                    <form onSubmit={handleManualSubmit} style={styles.manualForm}>
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="Paste or type QR code content"
                            style={styles.manualInput}
                        />
                        <button type="submit" style={styles.manualSubmit} disabled={processing}>
                            Validate
                        </button>
                    </form>
                </div>

                {/* Error Display */}
                {error && (
                    <div style={styles.errorAlert}>
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError(null)} style={styles.alertClose}>×</button>
                    </div>
                )}

                {/* Scan History */}
                {scanHistory.length > 0 && (
                    <div style={styles.historySection}>
                        <h3 style={styles.historyTitle}>Recent Scans</h3>
                        <div style={styles.historyList}>
                            {scanHistory.map(scan => (
                                <div key={scan.id} style={{
                                    ...styles.historyItem,
                                    borderLeftColor: scan.status === 'success' ? '#10B981' : '#EF4444'
                                }}>
                                    <span style={styles.historyType}>
                                        {scan.type === 'meal' ? '🍽️' : '🎫'}
                                    </span>
                                    <div style={styles.historyInfo}>
                                        <span style={styles.historyCode}>{scan.qrCode}</span>
                                        <span style={styles.historyTime}>{scan.time}</span>
                                    </div>
                                    <span style={{
                                        ...styles.historyStatus,
                                        color: scan.status === 'success' ? '#10B981' : '#EF4444'
                                    }}>
                                        {scan.status === 'success' ? '✓' : '✗'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
        maxWidth: '600px',
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
        borderTop: '3px solid #10B981',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
    },
    header: {
        textAlign: 'center',
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
    modeToggle: {
        display: 'flex',
        gap: '8px',
        marginBottom: '20px'
    },
    modeBtn: {
        flex: 1,
        padding: '14px',
        backgroundColor: '#F3F4F6',
        border: 'none',
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: '500',
        cursor: 'pointer',
        color: '#6B7280'
    },
    modeBtnActive: {
        flex: 1,
        padding: '14px',
        backgroundColor: '#10B981',
        border: 'none',
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        color: 'white'
    },
    eventSelector: {
        marginBottom: '20px'
    },
    selectorLabel: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px'
    },
    selectorInput: {
        width: '100%',
        padding: '12px 16px',
        border: '1px solid #E5E7EB',
        borderRadius: '10px',
        fontSize: '15px',
        boxSizing: 'border-box'
    },
    scannerCard: {
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        marginBottom: '24px',
        position: 'relative',
        minHeight: '200px'
    },
    cameraError: {
        padding: '20px',
        backgroundColor: '#FEF3C7',
        borderRadius: '10px',
        textAlign: 'center',
        marginBottom: '16px'
    },
    cameraControls: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '16px'
    },
    startCameraBtn: {
        padding: '14px 32px',
        backgroundColor: '#10B981',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    stopCameraBtn: {
        padding: '14px 32px',
        backgroundColor: '#EF4444',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    videoContainer: {
        borderRadius: '12px',
        overflow: 'hidden'
    },
    video: {
        width: '100%',
        maxHeight: '300px',
        objectFit: 'cover',
        borderRadius: '12px'
    },
    resultBox: {
        textAlign: 'center',
        padding: '40px 20px',
        borderRadius: '16px',
        border: '2px solid',
        marginBottom: '16px'
    },
    resultIcon: {
        fontSize: '48px',
        marginBottom: '16px'
    },
    resultTitle: {
        fontSize: '24px',
        fontWeight: '700',
        marginBottom: '8px'
    },
    resultMessage: {
        fontSize: '16px',
        color: '#374151'
    },
    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '20px',
        zIndex: 10
    },
    manualSection: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
        marginBottom: '24px'
    },
    manualTitle: {
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '12px',
        color: '#111827'
    },
    manualForm: {
        display: 'flex',
        gap: '12px'
    },
    manualInput: {
        flex: 1,
        padding: '12px 16px',
        border: '1px solid #E5E7EB',
        borderRadius: '10px',
        fontSize: '14px'
    },
    manualSubmit: {
        padding: '12px 24px',
        backgroundColor: '#3B82F6',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
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
    historySection: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
    },
    historyTitle: {
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '16px',
        color: '#111827'
    },
    historyList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    historyItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
        borderLeft: '3px solid'
    },
    historyType: {
        fontSize: '20px'
    },
    historyInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    historyCode: {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#374151'
    },
    historyTime: {
        fontSize: '12px',
        color: '#9CA3AF'
    },
    historyStatus: {
        fontSize: '18px',
        fontWeight: '700'
    }
};
