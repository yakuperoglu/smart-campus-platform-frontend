# Smart Campus Platform - Frontend

Next.js 14 ve React kullanılarak geliştirilmiş frontend uygulaması.

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. `.env.local` dosyasını oluşturun (opsiyonel):
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Çalıştırma

### Development
```bash
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.

### Production Build
```bash
npm run build
npm start
```

## Klasör Yapısı

```
frontend/
├── src/
│   ├── App.js         # Ana App component
│   ├── index.js       # Entry point
│   ├── assets/        # Statik asset'ler (resimler, fontlar vb.)
│   ├── components/    # React bileşenleri
│   ├── context/       # React Context API dosyaları
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Next.js Pages Router
│   │   ├── _app.js    # Custom App component
│   │   └── index.js   # Ana sayfa
│   ├── services/      # API servisleri ve dış servis entegrasyonları
│   ├── styles/        # CSS/stil dosyaları
│   │   └── globals.css
│   └── utils/         # Yardımcı fonksiyonlar
├── public/            # Statik dosyalar (Next.js public klasörü)
├── .env.example       # Environment variables örneği
├── next.config.js     # Next.js konfigürasyonu
├── package.json       # Proje bağımlılıkları
└── README.md          # Bu dosya
```

## Özellikler

- ⚡ Next.js 14 (Pages Router)
- ⚛️ React 18
- 📘 TypeScript desteği (JavaScript de kullanılabilir)
- 🎨 Modern CSS
- 🔌 API entegrasyonu hazır (Axios)
- 🎣 Custom Hooks desteği
- 🎭 Context API desteği

