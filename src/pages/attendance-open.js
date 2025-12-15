/**
 * Attendance Open Page (Faculty)
 * Öğretim üyesi için GPS tabanlı yoklama oturumu açma sayfası
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
          text: 'Dersler yüklenirken hata oluştu.'
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
        setLocationError('Konum alma işlemi zaman aşımına uğradı. Lütfen sınıf konumunu kullanın.');
        setMessage({ type: 'error', text: 'Konum alma işlemi zaman aşımına uğradı. Lütfen sınıf konumunu kullanın.' });
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
            errorMessage = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından (adres çubuğundaki kilit simgesi) konum iznini açın veya sınıf konumunu kullanın.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Konum bilgisi alınamadı. GPS\'inizin açık olduğundan emin olun veya sınıf konumunu kullanın.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Konum alma işlemi zaman aşımına uğradı. Lütfen sınıf konumunu kullanın.';
            break;
          default:
            errorMessage = `Konum alınamadı: ${error.message || 'Bilinmeyen hata'}. Lütfen sınıf konumunu kullanın.`;
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

  // Otomatik konum alma kaldırıldı - kullanıcı manuel olarak "Konum Al" butonuna tıklamalı

  // Yoklama oturumu oluşturma
  const handleCreateSession = async () => {
    if (!selectedSection) {
      setMessage({ type: 'error', text: 'Lütfen bir ders seçin.' });
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
      setMessage({ type: 'error', text: 'Lütfen konumunuzu alın veya sınıf konumunu kullanın.' });
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
          text: `Yoklama oturumu başarıyla açıldı! Oturum kodu: ${response.data.data.session.session_code}`
        });
        
        // Başarılı olduktan sonra dashboard'a yönlendir
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          'Yoklama oturumu açılırken bir hata oluştu.';
      
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
      setMessage({ type: 'success', text: 'Sınıf konumu kullanıldı!' });
    } else {
      setMessage({ type: 'error', text: 'Bu ders için sınıf konumu tanımlı değil.' });
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

  if (!user || user.role !== 'faculty') {
    return null;
  }

  return (
    <>
      <Head>
        <title>Yoklama Oturumu Aç - Smart Campus</title>
        <meta name="description" content="GPS tabanlı yoklama oturumu açma sayfası" />
      </Head>

      <Navbar />

      <div className="attendance-container">
        <div className="attendance-card">
          <h1>📋 Yoklama Oturumu Aç</h1>
          <p className="subtitle">Dersiniz için GPS tabanlı yoklama oturumu oluşturun</p>

          {message.text && (
            <FeedbackMessage
              type={message.type}
              message={message.text}
              onClose={() => setMessage({ type: '', text: '' })}
            />
          )}

          {/* Ders Seçimi */}
          <div className="form-group">
            <label htmlFor="section">Ders Seçin:</label>
            <select
              id="section"
              value={selectedSection?.id || ''}
              onChange={(e) => {
                const section = sections.find(s => s.id === e.target.value);
                setSelectedSection(section);
              }}
              className="form-select"
            >
              <option value="">Ders seçin...</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.course?.code || 'Ders'} - {section.course?.name || 'İsimsiz'} 
                  (Bölüm {section.section_number}, {section.semester} {section.year})
                </option>
              ))}
            </select>
            {sections.length === 0 && (
              <p className="help-text">Henüz size atanmış ders bulunmamaktadır.</p>
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
                🏫 Sınıf Konumunu Kullan ({selectedSection.classroom.building} {selectedSection.classroom.room_number})
              </button>
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
                  <strong>Enlem:</strong> {location.lat?.toFixed(6) || 'N/A'}
                </p>
                <p>
                  <strong>Boylam:</strong> {location.lng?.toFixed(6) || 'N/A'}
                </p>
                {gpsAccuracy && (
                  <p>
                    <strong>GPS Doğruluğu:</strong> ±{Math.round(gpsAccuracy)}m
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Yoklama Ayarları */}
          <div className="settings-section">
            <h3>Yoklama Ayarları</h3>
            
            <div className="form-group">
              <label htmlFor="radius">
                İzin Verilen Mesafe (metre): {radius}m
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
                Oturum Süresi (dakika):
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
              <p className="help-text">Öğrenciler bu süre içinde yoklama verebilir</p>
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
                    <strong>Yoklama Konumu</strong>
                    <br />
                    {location.lat?.toFixed(6) || 'N/A'}, {location.lng?.toFixed(6) || 'N/A'}
                    <br />
                    İzin verilen mesafe: {radius || 0}m
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
            {creating ? 'Yoklama Oturumu Açılıyor...' : '✅ Yoklama Oturumu Aç'}
          </button>

          {!location && !selectedSection?.classroom && (
            <p className="help-text">
              ⚠️ Yoklama oturumu açabilmek için konumunuzu alın veya sınıf konumunu kullanın.
            </p>
          )}

          {!selectedSection && (
            <p className="help-text">
              ⚠️ Lütfen bir ders seçin.
            </p>
          )}

          {selectedSection?.classroom && !location && (
            <p className="help-text" style={{ background: '#d4edda', color: '#155724' }}>
              💡 İpucu: Sınıf konumu mevcut. "Sınıf Konumunu Kullan" butonuna tıklayarak GPS olmadan da yoklama açabilirsiniz.
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

