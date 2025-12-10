/**
 * Landing Page - Welcome page for Smart Campus Platform
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="spinner"></div>
        <style jsx>{`
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Smart Campus - Kampüs Hayatını Tek Platformdan Yönet</title>
        <meta name="description" content="Smart Campus ile tüm kampüs hayatınızı tek bir platformdan yönetin. Akademik yönetim, GPS tabanlı yoklama, yemek rezervasyonu ve daha fazlası." />
      </Head>

      <div className="landing-page">
        {/* Header */}
        <header className="landing-header">
          <div className="landing-logo">
            🎓 Student Campus
          </div>
          <nav className="landing-nav">
            <Link href="/login" className="btn-nav btn-login">
              Giriş Yap
            </Link>
            <Link href="/register" className="btn-nav btn-register">
              Kayıt Ol
            </Link>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title">Smart Campus&apos;a Hoş Geldin</h1>
          <p className="hero-subtitle">
            Tüm kampüs hayatını tek bir platformdan yönet.
          </p>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="section-container">
            <h2 className="section-title">Öne Çıkan Özellikler</h2>
            <p className="section-subtitle">
              Kampüs hayatınızı kolaylaştıran güçlü özellikler
            </p>
            
            <div className="features-grid">
              <div className="feature-card">
                <span className="feature-icon">📚</span>
                <h3 className="feature-title">Akademik Yönetim</h3>
                <p className="feature-description">
                  Ders programınızı görüntüleyin, ders kayıtlarınızı yönetin ve akademik ilerlemenizi takip edin. Tüm akademik işlemlerinizi tek yerden yapın.
                </p>
              </div>

              <div className="feature-card">
                <span className="feature-icon">📍</span>
                <h3 className="feature-title">GPS Tabanlı Yoklama</h3>
                <p className="feature-description">
                  Kampüs içindeki konumunuzu kullanarak otomatik yoklama alın. Derslere zamanında katılımınızı kolayca takip edin.
                </p>
              </div>

              <div className="feature-card">
                <span className="feature-icon">🍽️</span>
                <h3 className="feature-title">Yemek Rezervasyonu</h3>
                <p className="feature-description">
                  Kampüs yemekhanesinden önceden rezervasyon yapın. Menüleri görüntüleyin ve favori yemeklerinizi seçin.
                </p>
              </div>

              <div className="feature-card">
                <span className="feature-icon">🎉</span>
                <h3 className="feature-title">Etkinlik Yönetimi</h3>
                <p className="feature-description">
                  Kampüs etkinliklerini keşfedin, kayıt olun ve katılımınızı yönetin. Sosyal hayatınızı organize edin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section">
          <div className="section-container">
            <h2 className="section-title">Nasıl Çalışır?</h2>
            <p className="section-subtitle">
              Sadece birkaç adımda başlayın
            </p>

            <div className="steps-container">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3 className="step-title">Kayıt Ol</h3>
                <p className="step-description">
                  Hızlı ve kolay kayıt işlemi ile hesabınızı oluşturun. Öğrenci, öğretim üyesi veya personel olarak kayıt olabilirsiniz.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">2</div>
                <h3 className="step-title">Kampüs Özelliklerini Kullan</h3>
                <p className="step-description">
                  Akademik yönetim, yoklama, yemek rezervasyonu ve etkinlik yönetimi gibi tüm özelliklerden faydalanın.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">3</div>
                <h3 className="step-title">Programını ve İlerlemeni Takip Et</h3>
                <p className="step-description">
                  Ders programınızı görüntüleyin, akademik ilerlemenizi takip edin ve kampüs hayatınızı organize edin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer-section">
          <p className="footer-text">
            © 2024 Smart Campus Platform. Tüm hakları saklıdır.
          </p>
        </footer>
      </div>
    </>
  );
}
