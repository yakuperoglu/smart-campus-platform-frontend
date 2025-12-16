/**
 * Attendance Open Page (Faculty)
 * GPS-based attendance session creation page for faculty members
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';

// Dynamic import for Leaflet (to prevent SSR issues)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

// Import Leaflet CSS
if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css');
}

export default function AttendanceOpen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [radius, setRadius] = useState(15);
  const [duration, setDuration] = useState(90);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const mapRef = useRef(null);

  // Redirect if not authenticated or not faculty
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'faculty')) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  // Öğretim üyesinin derslerini getir
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await api.get('/sections/my-sections');
        if (response.data.success) {
          setSections(response.data.data.sections || []);
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
        setMessage({
          type: 'error',
          text: 'Error loading your courses.'
        });
      }
    };

    if (user && user.role === 'faculty') {
      fetchSections();
    }
  }, [user]);

  // Konum alma fonksiyonu - Çok basit ve hızlı
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support location services.');
      setMessage({ type: 'error', text: 'Your browser does not support location services.' });
      return;
    }

    setLoadingLocation(true);
    setLocationError(null);
    setMessage({ type: '', text: '' });

    let completed = false;

    // Çok kısa güvenlik timeout'u - 12 saniye
    const safetyTimeout = setTimeout(() => {
      if (!completed) {
        completed = true;
        setLoadingLocation(false);
        setLocationError('Location request timed out. Please use classroom location.');
        setMessage({ type: 'error', text: 'Location request timed out. Please use classroom location.' });
      }
    }, 12000);

    // Çok basit ayarlarla getCurrentPosition
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (completed) return;
        completed = true;
        clearTimeout(safetyTimeout);
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setGpsAccuracy(accuracy || null);
        setLoadingLocation(false);
        setLocationError(null);
        setMessage({ type: 'success', text: 'Your location was successfully retrieved!' });
      },
      (error) => {
        if (completed) return;
        completed = true;
        clearTimeout(safetyTimeout);
        setLoadingLocation(false);
        let errorMessage = 'Unable to get location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location in browser settings or use classroom location.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Make sure GPS is enabled or use classroom location.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please use classroom location.';
            break;
          default:
            errorMessage = `Unable to get location: ${error.message || 'Unknown error'}. Please use classroom location.`;
        }

        setLocationError(errorMessage);
        setMessage({ type: 'error', text: errorMessage });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  };

  // Automatically get location
  useEffect(() => {
    if (user && user.role === 'faculty') {
      getCurrentLocation();
    }
  }, [user]);

  // Yoklama oturumu oluşturma
  const handleCreateSession = async () => {
    if (!selectedSection) {
      setMessage({ type: 'error', text: 'Please select a course.' });
      return;
    }

    // Eğer konum yoksa ama sınıf konumu varsa, sınıf konumunu kullan
    let finalLocation = location;
    if (!finalLocation && selectedSection?.classroom?.gps_lat && selectedSection?.classroom?.gps_long) {
      finalLocation = {
        lat: selectedSection.classroom.gps_lat,
        lng: selectedSection.classroom.gps_long
      };
    }

    if (!finalLocation) {
      setMessage({ type: 'error', text: 'Please get your location or use classroom location.' });
      return;
    }

    setCreating(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/attendance/sessions', {
        section_id: selectedSection.id,
        lat: finalLocation.lat,
        lon: finalLocation.lng,
        radius: radius,
        duration_minutes: duration,
        use_classroom_location: !location && selectedSection?.classroom ? true : false
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: `Attendance session started successfully!`
        });

        // Set active session to show QR view
        setActiveSession(response.data.data.session);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Error creating attendance session.';

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setCreating(false);
    }
  };

  // Seçili dersin sınıf konumunu kullan
  const useClassroomLocation = () => {
    if (selectedSection?.classroom?.gps_lat && selectedSection?.classroom?.gps_long) {
      setLocation({
        lat: selectedSection.classroom.gps_lat,
        lng: selectedSection.classroom.gps_long
      });
      setMessage({ type: 'success', text: 'Classroom location applied!' });
    } else {
      setMessage({ type: 'error', text: 'No classroom location defined for this course.' });
    }
  };

  // QR Code Rotation Logic
  useEffect(() => {
    let intervalId;

    if (activeSession && activeSession.id) {
      // Set initial QR code
      setQrCodeValue(activeSession.session_code);

      // Refresh function
      const refreshQr = async () => {
        try {
          const response = await api.put(`/attendance/sessions/${activeSession.id}/qr`);
          if (response.data.success) {
            setQrCodeValue(response.data.data.session_code);
          }
        } catch (error) {
          console.error('Error refreshing QR code:', error);
        }
      };

      // Set interval for 5 seconds
      intervalId = setInterval(refreshQr, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeSession]);

  const closeLiveSession = () => {
    setActiveSession(null);
    router.push('/dashboard');
  };

  // Leaflet icon sorununu düzelt
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    }
  }, []);

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'faculty') {
    return null;
  }

  return (
    <>
      <Head>
        <title>Open Attendance Session - Smart Campus</title>
        <meta name="description" content="GPS-based attendance session creation page" />
      </Head>

      <Navbar />

      <div className="attendance-container">
        <div className="attendance-card">
          <h1>📋 Open Attendance Session</h1>
          <p className="subtitle">Create a GPS-based attendance session for your course</p>

          {message.text && (
            <FeedbackMessage
              type={message.type}
              message={message.text}
              onClose={() => setMessage({ type: '', text: '' })}
            />
          )}

          {/* Select Course */}
          <div className="form-group">
            <label htmlFor="section">Select Course:</label>
            <select
              id="section"
              value={selectedSection?.id || ''}
              onChange={(e) => {
                const section = sections.find(s => s.id === e.target.value);
                setSelectedSection(section);
              }}
              className="form-select"
            >
              <option value="">Select course...</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.course?.code || 'Course'} - {section.course?.name || 'Unnamed'}
                  (Section {section.section_number}, {section.semester} {section.year})
                </option>
              ))}
            </select>
            {sections.length === 0 && (
              <p className="help-text">No courses assigned to you yet.</p>
            )}
          </div>

          {/* Sınıf Konumu Kullan */}
          {selectedSection?.classroom && (
            <div className="form-group">
              <button
                onClick={useClassroomLocation}
                className="btn-secondary"
                style={{ width: '100%' }}
              >
                🏫 Use Classroom Location ({selectedSection.classroom.building} {selectedSection.classroom.room_number})
              </button>
            </div>
          )}

          {/* Konum Bilgisi */}
          <div className="location-section">
            <div className="location-header">
              <h3>Location Information</h3>
              <button
                onClick={getCurrentLocation}
                disabled={loadingLocation}
                className="btn-secondary"
              >
                {loadingLocation ? 'Getting Location...' : '📍 Get Location'}
              </button>
            </div>

            {locationError && (
              <div className="error-box">
                <p>{locationError}</p>
              </div>
            )}

            {location && location.lat && location.lng && (
              <div className="location-info">
                <p>
                  <strong>Latitude:</strong> {location.lat?.toFixed(6) || 'N/A'}
                </p>
                <p>
                  <strong>Longitude:</strong> {location.lng?.toFixed(6) || 'N/A'}
                </p>
                {gpsAccuracy && (
                  <p>
                    <strong>GPS Accuracy:</strong> ±{Math.round(gpsAccuracy)}m
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Yoklama Ayarları */}
          <div className="settings-section">
            <h3>Attendance Settings</h3>

            <div className="form-group">
              <label htmlFor="radius">
                Allowed Distance (meters): {radius}m
              </label>
              <input
                type="range"
                id="radius"
                min="5"
                max="100"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="slider"
              />
              <div className="slider-labels">
                <span>5m</span>
                <span>100m</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="duration">
                Session Duration (minutes):
              </label>
              <input
                type="number"
                id="duration"
                min="5"
                max="480"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 90)}
                className="form-input"
              />
              <p className="help-text">Students can check in within this time period</p>
            </div>
          </div>

          {/* Harita */}
          {location && location.lat && location.lng && typeof window !== 'undefined' && (
            <div className="map-container">
              <MapContainer
                center={[location.lat, location.lng]}
                zoom={18}
                style={{ height: '400px', width: '100%', zIndex: 1 }}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Konum Marker */}
                <Marker position={[location.lat, location.lng]}>
                  <Popup>
                    <strong>Attendance Location</strong>
                    <br />
                    {location.lat?.toFixed(6) || 'N/A'}, {location.lng?.toFixed(6) || 'N/A'}
                    <br />
                    Allowed distance: {radius || 0}m
                  </Popup>
                </Marker>

                {/* Geofence Circle */}
                {radius && (
                  <Circle
                    center={[location.lat, location.lng]}
                    radius={radius}
                    pathOptions={{
                      color: '#667eea',
                      fillColor: '#667eea',
                      fillOpacity: 0.2,
                      weight: 2
                    }}
                  />
                )}
              </MapContainer>
            </div>
          )}

          {/* Yoklama Oturumu Aç Butonu */}
          <button
            onClick={handleCreateSession}
            disabled={(!location && !selectedSection?.classroom) || !selectedSection || creating}
            className="btn-primary btn-large"
            style={{ marginTop: '20px', width: '100%' }}
          >
            {creating ? 'Creating Session...' : '✅ Open Attendance Session'}
          </button>

          {!location && !selectedSection?.classroom && (
            <p className="help-text">
              ⚠️ Please get your location or use classroom location to open attendance session.
            </p>
          )}

          {!selectedSection && (
            <p className="help-text">
              ⚠️ Please select a course.
            </p>
          )}

          {selectedSection?.classroom && !location && (
            <p className="help-text" style={{ background: '#d4edda', color: '#155724' }}>
              💡 Tip: Classroom location is available. You can click "Use Classroom Location" to open attendance without GPS.
            </p>
          )}
        </div>
      </div>

      {/* Live Session Modal / Overlay */}
      {activeSession && (
        <div className="live-session-overlay">
          <div className="live-session-card">
            <div className="live-header">
              <h2>📡 Live Attendance Session</h2>
              <span className="live-badge">LIVE</span>
            </div>

            <div className="course-info">
              <h3>{activeSession.course?.code} - {activeSession.course?.name}</h3>
              <p>Section {activeSession.section?.section_number}</p>
            </div>

            <div className="qr-section">
              <div className="qr-container">
                {qrCodeValue ? (
                  <QRCodeSVG
                    value={activeSession.session_code}
                    size={256}
                    level={"H"}
                    includeMargin={true}
                  />
                ) : (
                  <p>Loading QR...</p>
                )}
              </div>
              <p className="qr-code-text">Session Code: <strong>{qrCodeValue}</strong></p>
              <p className="refresh-note">QR Code refreshes every 5 seconds</p>
            </div>

            <div className="session-actions">
              <button onClick={closeLiveSession} className="btn-secondary">
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .live-session-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.85);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .live-session-card {
          background: white;
          padding: 40px;
          border-radius: 20px;
          width: 100%;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .live-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .live-header h2 {
          margin: 0;
          color: #2c3e50;
        }

        .live-badge {
          background: #e74c3c;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 0.8rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .qr-section {
          margin: 30px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .qr-container {
          background: white;
          padding: 15px;
          display: inline-block;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          margin-bottom: 15px;
        }

        .qr-code-text {
          font-size: 1.2rem;
          color: #34495e;
          margin-bottom: 5px;
        }

        .refresh-note {
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .attendance-container {
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .attendance-card {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .attendance-card h1 {
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 2rem;
        }

        .subtitle {
          color: #7f8c8d;
          margin-bottom: 30px;
          font-size: 1.1rem;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #2c3e50;
          font-weight: 600;
        }

        .form-select,
        .form-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }

        .form-select:focus,
        .form-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .location-section,
        .settings-section {
          margin: 30px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .location-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .location-header h3,
        .settings-section h3 {
          color: #2c3e50;
          margin: 0;
        }

        .location-info {
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 6px;
        }

        .location-info p {
          margin: 8px 0;
          color: #34495e;
        }

        .slider {
          width: 100%;
          height: 8px;
          border-radius: 5px;
          background: #ddd;
          outline: none;
          -webkit-appearance: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 5px;
          font-size: 0.9rem;
          color: #7f8c8d;
        }

        .map-container {
          margin: 20px 0;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #e0e0e0;
        }

        .error-box {
          padding: 15px;
          background: #f8d7da;
          border: 1px solid #e74c3c;
          border-radius: 6px;
          color: #721c24;
          margin-top: 10px;
        }

        .btn-primary {
          background: #667eea;
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: #3498db;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #2980b9;
        }

        .btn-secondary:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }

        .btn-large {
          padding: 16px 32px;
          font-size: 1.2rem;
        }

        .help-text {
          margin-top: 10px;
          padding: 12px;
          background: #fff3cd;
          border-radius: 6px;
          color: #856404;
          text-align: center;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .attendance-card {
            padding: 20px;
          }

          .location-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .map-container {
            height: 300px !important;
          }
        }
      `}</style>
    </>
  );
}
