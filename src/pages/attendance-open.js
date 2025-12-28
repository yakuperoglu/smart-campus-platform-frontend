/**
 * Attendance Open Page (Faculty)
 * GPS-based attendance session creation page for faculty members
 * Refactored for SaaS Aesthetic
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';
import {
  MapPin,
  Navigation,
  Clock,
  maximize2,
  Radio,
  Map as MapIcon,
  CheckCircle,
  AlertCircle,
  QrCode,
  X
} from 'lucide-react';

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
  const { user, login, logout, loading: authLoading } = useAuth();
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

  // Konum alma fonksiyonu
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

    // Timeout safety
    const safetyTimeout = setTimeout(() => {
      if (!completed) {
        completed = true;
        setLoadingLocation(false);
        setLocationError('Location request timed out. Please use classroom location.');
        setMessage({ type: 'error', text: 'Location request timed out. Please use classroom location.' });
      }
    }, 12000);

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
      setQrCodeValue(activeSession.session_code);

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

  // Fix Leaflet icon issue
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

  if (authLoading || !user || user.role !== 'faculty') {
    return null;
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <Head>
        <title>Open Attendance Session - Smart Campus</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-2 duration-500">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Radio className="h-6 w-6 text-blue-600 animate-pulse" />
              Open Attendance Session
            </h1>
            <p className="mt-1 text-gray-500">Start a new GPS & QR based attendance checkpoint</p>
          </div>
        </div>

        {/* Feedback Message */}
        <FeedbackMessage
          type={message.type}
          message={message.text}
          onClose={() => setMessage({ type: '', text: '' })}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Settings */}
          <div className="lg:col-span-1 space-y-6">

            {/* Course Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <label htmlFor="section" className="block text-sm font-bold text-gray-700 mb-2">
                Select Course
              </label>
              <select
                id="section"
                value={selectedSection?.id || ''}
                onChange={(e) => {
                  const section = sections.find(s => s.id === e.target.value);
                  setSelectedSection(section);
                }}
                className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5"
              >
                <option value="">Select a course...</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.course?.code} - {section.course?.name} ({section.section_number})
                  </option>
                ))}
              </select>
              {sections.length === 0 && (
                <p className="text-xs text-red-500 mt-2">No courses assigned to you yet.</p>
              )}
            </div>

            {/* Location Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                Location Source
              </h3>

              <div className="space-y-3">
                <button
                  onClick={getCurrentLocation}
                  disabled={loadingLocation}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait"
                >
                  {loadingLocation ? (
                    <>
                      <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-2"></span>
                      Locating...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4 mr-2 text-blue-600" />
                      Get My GPS Location
                    </>
                  )}
                </button>

                {selectedSection?.classroom && (
                  <button
                    onClick={useClassroomLocation}
                    className="w-full flex items-center justify-center px-4 py-2 border border-blue-200 shadow-sm text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <MapIcon className="h-4 w-4 mr-2" />
                    Use Classroom ({selectedSection.classroom.building} {selectedSection.classroom.room_number})
                  </button>
                )}
              </div>

              {locationError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                  {locationError}
                </div>
              )}

              {gpsAccuracy && (
                <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  Accuracy: ±{Math.round(gpsAccuracy)}m
                </div>
              )}
            </div>

            {/* Session Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                Session Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                    Range Radius ({radius}m)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>5m</span>
                    <span>100m</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                    Duration ({duration} mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 90)}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleCreateSession}
              disabled={(!location && !selectedSection?.classroom) || !selectedSection || creating}
              className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-base font-bold rounded-xl shadow-lg text-white bg-slate-900 hover:bg-black transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {creating ? 'Creating Session...' : 'Start Session'}
            </button>
          </div>

          {/* Right Column: Map Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full min-h-[500px] relative">
              {location && location.lat && location.lng ? (
                <div className="h-full w-full absolute inset-0">
                  <MapContainer
                    center={[location.lat, location.lng]}
                    zoom={18}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[location.lat, location.lng]}>
                      <Popup>
                        <strong>Check-in Point</strong>
                        <br />
                        Radius: {radius}m
                      </Popup>
                    </Marker>
                    <Circle
                      center={[location.lat, location.lng]}
                      radius={radius}
                      pathOptions={{
                        color: '#2563eb',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.2,
                        weight: 2
                      }}
                    />
                  </MapContainer>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-gray-50">
                  <MapPin className="h-16 w-16 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium text-gray-900">Map Unavailable</h3>
                  <p className="max-w-xs mx-auto text-sm mt-2">
                    Please retrieve your location or select a classroom from the settings panel to preview the geofence area.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Session Modal */}
      {activeSession && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 animate-pulse">
                      LIVE
                    </span>
                    <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                      Live Attendance Session
                    </h3>
                  </div>
                  <button onClick={closeLiveSession} className="text-gray-400 hover:text-gray-500">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <h4 className="text-xl font-bold text-indigo-900">
                    {activeSession.course?.code}
                  </h4>
                  <p className="text-sm text-gray-500 mb-6">Section {activeSession.section?.section_number}</p>

                  <div className="bg-white p-4 inline-block rounded-xl border-2 border-gray-100 shadow-lg mb-4">
                    {qrCodeValue ? (
                      <QRCodeSVG
                        value={activeSession.session_code}
                        size={200}
                        level={"H"}
                        includeMargin={true}
                      />
                    ) : (
                      <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-3xl font-black text-gray-900 tracking-widest font-mono">
                      {qrCodeValue}
                    </p>
                    <p className="text-xs text-gray-500">
                      Code refreshes every 5 seconds for security
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeLiveSession}
                >
                  End Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
