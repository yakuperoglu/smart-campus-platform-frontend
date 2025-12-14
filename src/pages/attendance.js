/**
 * Attendance Check-in Page
 * Öğrenci için GPS tabanlı yoklama verme sayfası
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../config/api';
import FeedbackMessage from '../components/FeedbackMessage';

// Leaflet'i dynamic import ile yükle (SSR sorununu önlemek için)
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

// Leaflet CSS'i import et
if (typeof window !== 'undefined') {
  require('leaflet/dist/leaflet.css');
}

export default function Attendance() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [distance, setDistance] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const mapRef = useRef(null);

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
                            'Aktif yoklama oturumları yüklenirken hata oluştu.';
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

  // Konum alma fonksiyonu - Çok basit ve hızlı
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tarayıcınız konum servisini desteklemiyor.');
      setMessage({ type: 'error', text: 'Tarayıcınız konum servisini desteklemiyor.' });
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
        setLocationError('Konum alma işlemi zaman aşımına uğradı. Lütfen tarayıcı ayarlarınızdan konum iznini kontrol edin.');
        setMessage({ type: 'error', text: 'Konum alma işlemi zaman aşımına uğradı. Tarayıcı ayarlarından konum iznini kontrol edin.' });
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
        setMessage({ type: 'success', text: 'Konumunuz başarıyla alındı!' });
      },
      (error) => {
        if (completed) return;
        completed = true;
        clearTimeout(safetyTimeout);
        setLoadingLocation(false);
        let errorMessage = 'Konum alınamadı.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından (adres çubuğundaki kilit simgesi) konum iznini açın ve sayfayı yenileyin.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Konum bilgisi alınamadı. GPS\'inizin açık olduğundan emin olun.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Konum alma işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.';
            break;
          default:
            errorMessage = `Konum alınamadı: ${error.message || 'Bilinmeyen hata'}`;
        }
        
        setLocationError(errorMessage);
        setMessage({ type: 'error', text: errorMessage });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000, // 10 saniye - çok kısa
        maximumAge: 600000 // 10 dakika önceki konumu kabul et
      }
    );
  };

  // Mesafe hesaplama (Haversine formülü)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Dünya yarıçapı (metre)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Metre cinsinden mesafe
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

  // Otomatik konum alma kaldırıldı - kullanıcı manuel olarak "Konum Al" butonuna tıklamalı

  // Yoklama verme fonksiyonu
  const handleCheckIn = async () => {
    if (!location || !selectedSession) {
      setMessage({ type: 'error', text: 'Lütfen konumunuzu alın ve bir yoklama oturumu seçin.' });
      return;
    }

    setCheckingIn(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/attendance/checkin', {
        session_id: selectedSession.id,
        lat: location.lat,
        lon: location.lng,
        gps_accuracy: gpsAccuracy
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: response.data.message || 'Yoklama başarıyla verildi!'
        });
        
        // Başarılı olduktan sonra dashboard'a yönlendir
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          'Yoklama verilirken bir hata oluştu.';
      
      setMessage({ type: 'error', text: errorMessage });
      
      // Mesafe bilgisini göster
      if (error.response?.data?.error?.details?.distance) {
        const dist = error.response.data.error.details.distance;
        const radius = error.response.data.error.details.allowed_radius;
        setDistance(dist);
      }
    } finally {
      setCheckingIn(false);
    }
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
    return <div>Yükleniyor...</div>;
  }

  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <>
      <Head>
        <title>Yoklama Ver - Smart Campus</title>
        <meta name="description" content="GPS tabanlı yoklama verme sayfası" />
      </Head>

      <Navbar />

      <div className="attendance-container">
        <div className="attendance-card">
          <h1>📍 Yoklama Ver</h1>
          <p className="subtitle">Konumunuzu kullanarak yoklamanızı verin</p>

          {message.text && (
            <FeedbackMessage
              type={message.type}
              message={message.text}
              onClose={() => setMessage({ type: '', text: '' })}
            />
          )}

          {/* Aktif Oturum Seçimi */}
          {activeSessions.length > 0 ? (
            <div className="form-group">
              <label htmlFor="session">Yoklama Oturumu Seçin:</label>
              <select
                id="session"
                value={selectedSession?.id || ''}
                onChange={(e) => {
                  const session = activeSessions.find(s => s.id === e.target.value);
                  setSelectedSession(session);
                }}
                className="form-select"
              >
                <option value="">Oturum seçin...</option>
                {activeSessions.map((session) => {
                  let timeStr = '';
                  try {
                    if (session.start_time) {
                      const date = new Date(session.start_time);
                      if (!isNaN(date.getTime())) {
                        timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                      }
                    }
                  } catch (e) {
                    console.error('Date parsing error:', e);
                  }
                  return (
                    <option key={session.id} value={session.id}>
                      {session.section?.course?.name || 'Ders'} - 
                      {session.section?.section_number ? ` Bölüm ${session.section.section_number}` : ''} 
                      {timeStr ? ` (${timeStr})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="info-box">
              <p>Şu anda aktif yoklama oturumu bulunmamaktadır.</p>
            </div>
          )}

          {/* Konum Bilgisi */}
          <div className="location-section">
            <div className="location-header">
              <h3>Konum Bilgisi</h3>
              <button
                onClick={getCurrentLocation}
                disabled={loadingLocation}
                className="btn-secondary"
              >
                {loadingLocation ? 'Konum Alınıyor...' : '📍 Konum Al'}
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
                  <strong>Enlem:</strong> {location.lat.toFixed(6)}
                </p>
                <p>
                  <strong>Boylam:</strong> {location.lng.toFixed(6)}
                </p>
                {gpsAccuracy && (
                  <p>
                    <strong>GPS Doğruluğu:</strong> ±{Math.round(gpsAccuracy)}m
                  </p>
                )}
              </div>
            )}

            {/* Mesafe Bilgisi */}
            {distance !== null && selectedSession && selectedSession.geofence_radius && (
              <div className={`distance-info ${distance <= selectedSession.geofence_radius ? 'within-radius' : 'outside-radius'}`}>
                <p>
                  <strong>Sınıfa Mesafe:</strong> {distance?.toFixed(1) || '0'}m
                </p>
                <p>
                  <strong>İzin Verilen Mesafe:</strong> {selectedSession.geofence_radius}m
                </p>
                {distance <= selectedSession.geofence_radius ? (
                  <p className="status-success">✅ Sınıf alanı içindesiniz</p>
                ) : (
                  <p className="status-error">❌ Sınıf alanı dışındasınız</p>
                )}
              </div>
            )}
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
                
                {/* Öğrenci Konumu */}
                <Marker position={[location.lat, location.lng]}>
                  <Popup>
                    <strong>Benim Konumum</strong>
                    <br />
                    {location.lat?.toFixed(6) || 'N/A'}, {location.lng?.toFixed(6) || 'N/A'}
                  </Popup>
                </Marker>

                {/* Sınıf Konumu */}
                {selectedSession && selectedSession.center_lat && selectedSession.center_long && (
                  <>
                    <Marker position={[selectedSession.center_lat, selectedSession.center_long]}>
                      <Popup>
                        <strong>Sınıf Konumu</strong>
                        <br />
                        {selectedSession.center_lat?.toFixed(6) || 'N/A'}, {selectedSession.center_long?.toFixed(6) || 'N/A'}
                        <br />
                        İzin verilen mesafe: {selectedSession.geofence_radius || 0}m
                      </Popup>
                    </Marker>
                    
                    {/* Geofence Circle */}
                    {selectedSession.geofence_radius && (
                      <Circle
                        center={[selectedSession.center_lat, selectedSession.center_long]}
                        radius={selectedSession.geofence_radius}
                        pathOptions={{
                          color: distance !== null && distance <= selectedSession.geofence_radius ? '#27ae60' : '#e74c3c',
                          fillColor: distance !== null && distance <= selectedSession.geofence_radius ? '#27ae60' : '#e74c3c',
                          fillOpacity: 0.2,
                          weight: 2
                        }}
                      />
                    )}
                  </>
                )}
              </MapContainer>
            </div>
          )}

          {/* Yoklama Ver Butonu */}
          <button
            onClick={handleCheckIn}
            disabled={!location || !selectedSession || checkingIn || (distance !== null && distance > selectedSession?.geofence_radius)}
            className="btn-primary btn-large"
            style={{ marginTop: '20px', width: '100%' }}
          >
            {checkingIn ? 'Yoklama Veriliyor...' : '✅ Buradayım / Yoklama Ver'}
          </button>

          {!location && (
            <p className="help-text">
              ⚠️ Yoklama verebilmek için önce konumunuzu almanız gerekmektedir.
            </p>
          )}

          {location && selectedSession && distance !== null && distance > selectedSession.geofence_radius && (
            <p className="help-text error">
              ⚠️ Sınıf alanı dışındasınız. Lütfen sınıfa yaklaşın.
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
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

        .form-select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }

        .form-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .location-section {
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

        .location-header h3 {
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

        .distance-info {
          margin-top: 15px;
          padding: 15px;
          border-radius: 6px;
          border: 2px solid;
        }

        .distance-info.within-radius {
          background: #d4edda;
          border-color: #27ae60;
          color: #155724;
        }

        .distance-info.outside-radius {
          background: #f8d7da;
          border-color: #e74c3c;
          color: #721c24;
        }

        .distance-info p {
          margin: 5px 0;
        }

        .status-success {
          font-weight: 600;
          margin-top: 10px !important;
        }

        .status-error {
          font-weight: 600;
          margin-top: 10px !important;
        }

        .map-container {
          margin: 20px 0;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #e0e0e0;
        }

        .info-box {
          padding: 15px;
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 6px;
          color: #856404;
          margin-bottom: 20px;
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
          margin-top: 15px;
          padding: 12px;
          background: #fff3cd;
          border-radius: 6px;
          color: #856404;
          text-align: center;
        }

        .help-text.error {
          background: #f8d7da;
          color: #721c24;
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

