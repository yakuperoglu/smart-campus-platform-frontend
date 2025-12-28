/**
 * About Page - Hakkımızda Sayfası
 */

import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <Head>
        <title>Hakkımızda - Smart Campus Platform</title>
        <meta name="description" content="Smart Campus hakkında bilgi edinin. Kampüs yaşamını kolaylaştıran bütünleşik platform." />
      </Head>

      <div className="landing-page">
        {/* Header */}
        <header className="landing-header">
          <div className="landing-logo">
            🎓 Student Campus
          </div>
          <nav className="landing-nav">
            <Link href="/" className="btn-nav btn-about">
              Ana Sayfa
            </Link>
            <Link href="/about" className="btn-nav btn-about active">
              Hakkımızda
            </Link>
            <Link href="/login" className="btn-nav btn-login">
              Giriş Yap
            </Link>
            <Link href="/register" className="btn-nav btn-register">
              Kayıt Ol
            </Link>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-hero-content">
            <h1 className="about-hero-title">Hakkımızda</h1>
            <p className="about-hero-subtitle">Kampüs yaşamını dönüştüren akıllı çözüm</p>
          </div>
        </section>

        {/* About Content */}
        <section className="about-section">
          <div className="about-container">
            {/* Introduction */}
            <div className="about-intro-section">
              <div className="intro-icon">🎓</div>
              <h2 className="section-title">Smart Campus Nedir?</h2>
              <p className="about-intro">
                Smart Campus, öğrencilerin, akademisyenlerin ve üniversite çalışanlarının kampüs yaşamını daha verimli, düzenli ve erişilebilir hale getirmek için geliştirilmiş bütünleşik bir kampüs yönetim platformudur.
              </p>
              <p className="about-text">
                Tek bir dijital ekosistem üzerinden ders yönetimi, yoklama takibi, yemek rezervasyonu, etkinlik katılımı, bildirimler ve daha birçok süreci kolaylaştırarak üniversite deneyimini modern bir seviyeye taşır.
              </p>
            </div>

            {/* Goals Section */}
            <div className="about-goals-section">
              <div className="goals-header">
                <div className="goals-icon">🎯</div>
                <h2 className="section-title">Amacımız</h2>
              </div>
              <div className="goals-grid">
                <div className="goal-card">
                  <div className="goal-icon">💬</div>
                  <h3 className="goal-title">İletişimi Güçlendirmek</h3>
                  <p className="goal-description">Kampüs içi iletişimi güçlendirerek tüm paydaşlar arasında etkili bir köprü kuruyoruz.</p>
                </div>
                <div className="goal-card">
                  <div className="goal-icon">🎯</div>
                  <h3 className="goal-title">Tek Noktadan Çözüm</h3>
                  <p className="goal-description">Öğrencilerin günlük ihtiyaçlarını tek noktadan karşılayarak zaman tasarrufu sağlıyoruz.</p>
                </div>
                <div className="goal-card">
                  <div className="goal-icon">⚡</div>
                  <h3 className="goal-title">Dijitalleştirme</h3>
                  <p className="goal-description">Akademik süreçleri dijitalleştirerek hızlandırıyor ve verimliliği artırıyoruz.</p>
                </div>
                <div className="goal-card">
                  <div className="goal-icon">🔍</div>
                  <h3 className="goal-title">Şeffaf Yönetim</h3>
                  <p className="goal-description">Üniversitelerde daha şeffaf, erişilebilir ve etkili bir yönetim modeli sunuyoruz.</p>
                </div>
              </div>
            </div>

            {/* Vision Section */}
            <div className="about-vision-section">
              <div className="vision-content">
                <div className="vision-icon">🚀</div>
                <h2 className="section-title">Vizyonumuz</h2>
                <p className="vision-text">
                  Smart Campus, kullanıcı odaklı arayüzü, güvenli altyapısı ve esnek modüler yapısıyla hem öğrenciler hem de üniversite personeli için zahmetsiz bir deneyim sunar.
                </p>
                <p className="vision-text">
                  Geleceğin kampüs yaşamını bugünden inşa eden akıllı bir çözüm üretmeyi hedefliyoruz.
                </p>
              </div>
            </div>

            {/* Contact Section */}
            <div className="about-contact-section">
              <div className="contact-card">
                <div className="contact-icon">📧</div>
                <h2 className="contact-title">Bizimle İletişime Geç</h2>
                <p className="contact-text">
                  Sorularınız veya geri bildirimleriniz için bize ulaşabilirsiniz.
                </p>
                <a href="mailto:support@smartcampus.com" className="contact-email">
                  support@smartcampus.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .about-hero {
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          padding: 140px 2rem 80px;
          text-align: center;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .about-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('/photo1.png');
          background-size: cover;
          background-position: center;
          opacity: 0.1;
          z-index: 0;
        }

        .about-hero-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: 0 auto;
        }

        .about-hero-title {
          font-size: 4rem;
          font-weight: 800;
          margin-bottom: 1rem;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.03em;
          animation: fadeInUp 0.8s ease;
        }

        .about-hero-subtitle {
          font-size: 1.5rem;
          font-weight: 400;
          opacity: 0.95;
          font-family: 'Inter', sans-serif;
          animation: fadeInUp 1s ease;
        }

        .about-section {
          padding: 80px 2rem;
          background: #f8fafc;
        }

        .about-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 1.5rem;
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.02em;
          text-align: center;
        }

        .about-intro-section {
          background: white;
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          margin-bottom: 4rem;
          text-align: center;
        }

        .intro-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }

        .about-intro {
          font-size: 1.3rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          color: #1e3a8a;
          line-height: 1.7;
        }

        .about-text {
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
          color: #4a5568;
          line-height: 1.8;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .about-goals-section {
          margin-bottom: 4rem;
        }

        .goals-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .goals-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .goal-card {
          background: white;
          padding: 2.5rem 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          text-align: center;
          border: 2px solid transparent;
        }

        .goal-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(30, 64, 175, 0.2);
          border-color: #1e40af;
        }

        .goal-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .goal-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 1rem;
          font-family: 'Inter', sans-serif;
        }

        .goal-description {
          font-size: 1rem;
          color: #4a5568;
          line-height: 1.6;
        }

        .about-vision-section {
          background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
          padding: 4rem 3rem;
          border-radius: 16px;
          margin-bottom: 4rem;
          color: white;
          text-align: center;
        }

        .vision-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .vision-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }

        .vision-content .section-title {
          color: white;
          margin-bottom: 2rem;
        }

        .vision-text {
          font-size: 1.2rem;
          line-height: 1.8;
          margin-bottom: 1.5rem;
          opacity: 0.95;
        }

        .about-contact-section {
          margin-top: 4rem;
        }

        .contact-card {
          background: white;
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          text-align: center;
          border: 2px solid #e2e8f0;
        }

        .contact-icon {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
        }

        .contact-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 1rem;
          font-family: 'Inter', sans-serif;
        }

        .contact-text {
          font-size: 1.1rem;
          color: #4a5568;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .contact-email {
          display: inline-block;
          font-size: 1.3rem;
          font-weight: 600;
          color: #1e40af;
          text-decoration: none;
          padding: 0.75rem 2rem;
          border: 2px solid #1e40af;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .contact-email:hover {
          background: #1e40af;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .about-hero {
            padding: 120px 1rem 60px;
          }

          .about-hero-title {
            font-size: 2.5rem;
          }

          .about-hero-subtitle {
            font-size: 1.2rem;
          }

          .about-section {
            padding: 60px 1rem;
          }

          .section-title {
            font-size: 2rem;
          }

          .about-intro-section {
            padding: 2rem 1.5rem;
          }

          .about-intro {
            font-size: 1.1rem;
          }

          .goals-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .about-vision-section {
            padding: 3rem 2rem;
          }

          .vision-text {
            font-size: 1.1rem;
          }

          .contact-card {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </>
  );
}

