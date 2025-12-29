/**
 * Attendance Check-in Page
 * GPS-based attendance check-in page for students
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { MapPin, QrCode, Navigation, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

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

export default function Attendance() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [distance, setDistance] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const mapRef = useRef(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  // Redirect if not authenticated or not student
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'student')) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  // Aktif yoklama oturumlarını getir
  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const response = await api.get('/attendance/active');
        if (response.data.success) {
          setActiveSessions(response.data.data.sessions || []);
          // Eğer sadece bir oturum varsa otomatik seç
          if (response.data.data.sessions?.length === 1) {
            setSelectedSession(response.data.data.sessions[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching active sessions:', error);
        const errorMessage = error.response?.data?.error?.message ||
          error.response?.data?.message ||
          'Error loading active attendance sessions.';
        setMessage({
          type: 'error',
          text: errorMessage
        });
      }
    };

    if (user && user.role === 'student') {
      fetchActiveSessions();
    }
  }, [user]);

  // Automatically get location
  useEffect(() => {
    if (user && user.role === 'student') {
      getCurrentLocation();
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
    const safetyTimeout = setTimeout(() => {
      if (!completed) {
        completed = true;
        setLoadingLocation(false);
        setLocationError('Location request timed out. Please check permissions.');
        setMessage({ type: 'error', text: 'Location request timed out. Check permissions.' });
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
        setMessage({ type: 'success', text: 'Location retrieved successfully!' });
      },
      (error) => {
        if (completed) return;
        completed = true;
        clearTimeout(safetyTimeout);
        setLoadingLocation(false);
        let errorMessage = 'Unable to get location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Check GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = `Location Error: ${error.message}`;
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

  // Distance calculation (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius (meters)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Mesafeyi güncelle
  useEffect(() => {
    if (location && selectedSession) {
      const dist = calculateDistance(
        location.lat,
        location.lng,
        selectedSession.center_lat,
        selectedSession.center_long
      );
      setDistance(dist);
    }
  }, [location, selectedSession]);

  // QR Scanner Effect
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render((decodedText) => {
        scanner.clear();
        setShowScanner(false);
        handleCheckIn(decodedText);
      }, (error) => { });

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [showScanner]);

  // Yoklama verme fonksiyonu
  const handleCheckIn = async (qrCode = null) => {
    if (!location) {
      setMessage({ type: 'error', text: 'Please get your location first.' });
      return;
    }

    if (!selectedSession && !qrCode) {
      setMessage({ type: 'error', text: 'Select a session or scan QR code.' });
      return;
    }

    setCheckingIn(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        lat: location.lat,
        lon: location.lng,
        gps_accuracy: gpsAccuracy
      };

      if (qrCode) {
        payload.session_code = qrCode;
      } else {
        payload.session_id = selectedSession.id;
      }

      const response = await api.post('/attendance/checkin', payload);

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: response.data.message || 'Attendance submitted successfully!'
        });

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Error submitting attendance.';

      setMessage({ type: 'error', text: errorMessage });

      if (error.response?.data?.error?.details?.distance) {
        const dist = error.response.data.error.details.distance;
        setDistance(dist);
      }
    } finally {
      setCheckingIn(false);
    }
  };

  // Leaflet icon fix
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

  if (authLoading || (!user || user.role !== 'student')) {
    return null;
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <Head>
        <title>Check-in - Smart Campus</title>
      </Head>

      <FeedbackMessage
        type={message.type}
        message={message.text}
        onClose={() => setMessage({ type: '', text: '' })}
      />

      <div className="mb-6 animate-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Attendance Check-in</h1>
        <p className="text-gray-500 mt-1">Check in to your classes using GPS or QR Code.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Controls */}
        <div className="space-y-6 animate-in slide-in-from-bottom-3 duration-500 delay-100">

          {/* Active Session Selection */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-500" />
              Select Session
            </h3>

            {activeSessions.length > 0 ? (
              <div className="space-y-4">
                <select
                  id="session"
                  value={selectedSession?.id || ''}
                  onChange={(e) => {
                    const session = activeSessions.find(s => s.id === e.target.value);
                    setSelectedSession(session);
                  }}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg border"
                >
                  <option value="">-- Choose active class --</option>
                  {activeSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.section?.course?.name} ({session.section?.course?.code})
                    </option>
                  ))}
                </select>

                {selectedSession?.already_checked_in && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">You have already checked in.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-500 text-sm">No active sessions found nearby.</p>
              </div>
            )}
          </div>

          {/* Location Status */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-500" />
                Location Status
              </h3>
              <button
                onClick={getCurrentLocation}
                disabled={loadingLocation}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Refresh Location"
              >
                <RefreshCw className={`h-4 w-4 ${loadingLocation ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {locationError ? (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {locationError}
              </div>
            ) : location ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-500">Latitude</span>
                  <span className="font-mono font-medium text-gray-900">{location.lat.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-500">Longitude</span>
                  <span className="font-mono font-medium text-gray-900">{location.lng.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm py-2">
                  <span className="text-gray-500">Accuracy</span>
                  <span className="font-mono font-medium text-gray-900">±{Math.round(gpsAccuracy)}m</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-400 italic text-sm">Location not yet retrieved</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleCheckIn(null)}
              disabled={!location || !selectedSession || checkingIn || selectedSession?.already_checked_in}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold shadow-sm transition-all
                  ${!location || !selectedSession || checkingIn || selectedSession?.already_checked_in
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'}`}
            >
              <div className="flex flex-col items-center">
                <span className="text-sm">Check In</span>
                <span className="text-[10px] font-normal opacity-80">(GPS Only)</span>
              </div>
            </button>

            <button
              onClick={() => setShowScanner(true)}
              disabled={!location || checkingIn}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold shadow-sm bg-slate-900 text-white hover:bg-black transition-all"
            >
              <QrCode className="h-5 w-5" />
              <span className="text-sm">Scan QR</span>
            </button>
          </div>
        </div>

        {/* Right Column: Map */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[500px] relative animate-in slide-in-from-bottom-3 duration-500 delay-200">
          {location && typeof window !== 'undefined' && !showScanner ? (
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={18}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[location.lat, location.lng]}>
                <Popup>You are here</Popup>
              </Marker>

              {selectedSession && selectedSession.center_lat && (
                <>
                  <Marker position={[selectedSession.center_lat, selectedSession.center_long]}>
                    <Popup>Classroom: {selectedSession.section?.course?.code}</Popup>
                  </Marker>
                  <Circle
                    center={[selectedSession.center_lat, selectedSession.center_long]}
                    radius={selectedSession.geofence_radius}
                    pathOptions={{
                      color: distance !== null && distance <= selectedSession.geofence_radius ? '#22c55e' : '#ef4444',
                      fillColor: distance !== null && distance <= selectedSession.geofence_radius ? '#22c55e' : '#ef4444',
                      fillOpacity: 0.2
                    }}
                  />
                </>
              )}
            </MapContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
              <MapPin className="h-12 w-12 mb-2 opacity-20" />
              <p>Map will load when location is available</p>
            </div>
          )}

          {/* Distance Status Overlay */}
          {distance !== null && selectedSession && (
            <div className={`absolute bottom-4 left-4 right-4 p-4 rounded-xl backdrop-blur-md border shadow-lg z-[1000] flex justify-between items-center
                  ${distance <= selectedSession.geofence_radius
                ? 'bg-green-500/90 border-green-600 text-white'
                : 'bg-red-500/90 border-red-600 text-white'}`}>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold opacity-80">Distance to Class</p>
                <p className="text-xl font-bold">{distance.toFixed(1)}m</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider font-bold opacity-80">Allowed</p>
                <p className="font-mono">{selectedSession.geofence_radius}m</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Scan QR Code</h3>
              <button onClick={() => setShowScanner(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-4 bg-black">
              <div id="reader" className="w-full rounded-lg overflow-hidden"></div>
            </div>
            <div className="p-4 bg-gray-50 text-center">
              <p className="text-xs text-gray-500">Point your camera at the session QR code</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
