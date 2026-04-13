# Sigen Energy Dashboard - Hybrid Energy Management System

Dashboard full-stack untuk manajemen energi hybrid dengan integrasi Sigen Cloud API.

## 📁 Struktur Folder

```
/workspace
├── backend/                    # Node.js + Express + WebSocket
│   ├── auth/sigenAuth.js       # OAuth2 authentication
│   ├── proxy/sigenApi.js       # Sigen API wrapper
│   ├── cache/dataStore.js      # Data caching
│   ├── ws/broadcaster.js       # WebSocket broadcaster
│   ├── server.js               # Main server
│   └── .env                    # Environment variables
│
└── frontend/                   # React + Vite + TailwindCSS
    ├── src/
    │   ├── components/         # UI components
    │   ├── hooks/              # Custom React hooks
    │   ├── utils/mapper.js     # Data transformation
    │   └── App.jsx             # Main app
    └── .env.local              # Environment variables
```

## 🚀 Cara Menjalankan

### Backend (Terminal 1)
```bash
cd /workspace/backend
npm install
cp .env.example .env
# Edit .env dengan credentials Anda
npm run dev
```

### Frontend (Terminal 2)
```bash
cd /workspace/frontend
npm install
npm run dev
```

## 🔑 Konfigurasi Credentials

Edit file `backend/.env`:
```env
SIGEN_USERNAME=BBS@gatrianusantara.com
SIGEN_PASSWORD=your_password_here
PORT=4000
```

## 🎨 Fitur

- **Real-time Monitoring**: Update setiap 5 detik via WebSocket
- **Energy Flow Diagram**: Visualisasi aliran energi PV → Battery/Load/Grid
- **Hierarchical Vessel List**: Sidebar dengan struktur perusahaan → kapal
- **Runtime Charts**: Battery dan Generator runtime (7D/14D/30D)
- **Rate Limit Handling**: Antre otomatis 5 menit jika kena limit API
- **Dark Theme**: Tampilan modern sesuai mockup

## 📊 API Endpoints

Backend bertindak sebagai proxy aman ke Sigen API:

- `GET /api/systems` - List semua vessel
- `GET /api/system/:id/realtime` - Realtime energy flow
- `GET /api/system/:id/history?period=7d` - Historical data
- `WebSocket /ws` - Real-time push setiap 5 detik

## ⚠️ Rate Limiting

Sigen API membatasi 1 request per 5 menit. Backend menangani dengan:
1. Cache response selama 300 detik
2. Broadcast data cache ke frontend setiap 5 detik
3. Jika kena error 1201 (Access Restriction), tunggu 5 menit sebelum retry
4. Tidak ada mock data - hanya data real dari API

## 🧪 Testing Tanpa Credentials

Jika credentials tidak dikonfigurasi atau gagal login:
- Backend akan menampilkan error rate limit
- Frontend akan menunjukkan status "CONNECTION ERROR"
- Tidak ada data palsu yang ditampilkan

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- WebSocket (ws)
- node-cache
- axios

**Frontend:**
- React 18 + Vite
- TailwindCSS
- Recharts
- WebSocket client

## 📝 Mockup Reference

Frontend dibuat sesuai mockup HTML dengan:
- Dark theme (#0f1117 background)
- Hierarchical sidebar menu
- SVG ship diagram dengan animasi aliran energi
- Runtime charts dengan Recharts
- Status badges dan countdown timer
