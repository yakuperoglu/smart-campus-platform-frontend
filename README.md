# Smart Campus Platform

Akıllı Kampüs Platformu - React Next.js frontend ve Node.js backend ile geliştirilmiş full-stack uygulama.

## 🏗️ Proje Yapısı

```
smart-campus-platform/
├── frontend/          # Next.js 14 + React 18 + TypeScript
├── backend/           # Node.js + Express
└── docs/              # Dokümantasyon
```

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js (v18 veya üzeri)
- npm veya yarn

### Backend Kurulumu

```bash
cd backend
npm install
cp .env.example .env  # .env dosyasını düzenleyin
npm run dev
```

Backend varsayılan olarak `http://localhost:5000` adresinde çalışacaktır.

### Frontend Kurulumu

```bash
cd frontend
npm install
npm run dev
```

Frontend varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

## 📦 Teknolojiler

### Frontend
- **Next.js 14** - React framework (App Router)
- **React 18** - UI kütüphanesi
- **TypeScript** - Tip güvenliği
- **Axios** - HTTP istekleri

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables
- **Morgan** - HTTP request logger

## 📁 Klasör Yapısı

### Backend
```
backend/
├── server.js          # Ana server dosyası
├── routes/            # API route'ları
├── controllers/       # Controller'lar
├── models/            # Veritabanı modelleri
├── middleware/        # Custom middleware'ler
├── utils/             # Yardımcı fonksiyonlar
└── config/            # Konfigürasyon dosyaları
```

### Frontend
```
frontend/
├── app/               # Next.js App Router
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Ana sayfa
│   └── globals.css   # Global stiller
├── components/        # React bileşenleri
├── lib/              # Yardımcı fonksiyonlar
├── public/           # Statik dosyalar
└── types/            # TypeScript type tanımları
```

## 🔧 Geliştirme

### Backend API Endpoints

- `GET /` - API bilgileri
- `GET /api/health` - Health check

### Environment Variables

Backend için `.env` dosyası:
```env
PORT=5000
NODE_ENV=development
```

Frontend için `.env.local` dosyası (opsiyonel):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📝 Notlar

- Backend ve frontend ayrı portlarda çalışır
- CORS yapılandırması backend'de hazırdır
- Frontend'de API URL'i environment variable ile yapılandırılabilir
- Her iki proje için ayrı `package.json` dosyaları mevcuttur

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

ISC
