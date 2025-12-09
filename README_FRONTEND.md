# Smart Campus Platform - Frontend

React frontend for Smart Campus Ecosystem Management Platform.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `ENV_EXAMPLE.txt` to `.env.local`:
```bash
copy ENV_EXAMPLE.txt .env.local
```

Or create `.env.local` manually:
```env
REACT_APP_API_BASE_URL=http://localhost:3000/api/v1
```

### 3. Start Development Server
```bash
npm run dev
```

The app will be available at: `http://localhost:3000`

## 📋 Features

### ✅ Implemented (Part 1)
- **Authentication System**
  - Login page
  - Register page (Student/Faculty)
  - JWT token management
  - Automatic token refresh
  - Protected routes

- **Dashboard**
  - User profile display
  - Role-specific information
  - Wallet balance
  - Feature cards (placeholder)

### 🔜 Coming Soon (Part 2-4)
- Course management
- GPS-based attendance
- Meal reservations
- Event management
- IoT sensor monitoring

## 📂 Project Structure

```
src/
├── components/
│   └── ProtectedRoute.jsx    # Route protection
├── config/
│   └── api.js                 # Axios instance
├── context/
│   └── AuthContext.jsx        # Auth state management
├── pages/
│   ├── Login.jsx              # Login page
│   ├── Register.jsx           # Register page
│   ├── Dashboard.jsx          # Dashboard
│   ├── Auth.css               # Auth pages styling
│   └── Dashboard.css          # Dashboard styling
├── styles/
│   └── globals.css            # Global styles
├── index.js                   # Entry point with routing
└── App.js                     # App wrapper
```

## 🔐 Authentication Flow

1. **Login**: User enters credentials → API validates → Tokens saved to localStorage
2. **Token Management**: Access token (15m) auto-refreshed using refresh token (7d)
3. **Protected Routes**: Unauthenticated users redirected to login
4. **Logout**: Tokens cleared from localStorage

## 🧪 Test Credentials

Use these credentials from the seeded database:

| Email | Password | Role |
|-------|----------|------|
| admin@smartcampus.edu | admin123 | Admin |
| student1@smartcampus.edu | student123 | Student |
| john.doe@smartcampus.edu | faculty123 | Faculty |

## 🛠️ Technologies

- **Next.js 14** - React framework with built-in routing
- **React 18** - UI library
- **Axios** - HTTP client
- **CSS3** - Styling (no framework, custom design)

## 📡 API Integration

The frontend connects to the backend API at `http://localhost:3000/api/v1`

### Endpoints Used
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `GET /users/me` - Get current user profile

## 🎨 Design Features

- Modern gradient design
- Smooth animations
- Responsive layout
- Role-based UI elements
- Loading states
- Error handling

## 📝 Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## 🔗 Related

- **Backend**: `../smart-campus-platform-backend`
- **API Docs**: http://localhost:3000/api-docs

---

**Version**: 1.0.0  
**Last Updated**: 9 Aralık 2025
