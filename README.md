# Sigen Energy Dashboard - Full Stack Project

Dashboard manajemen energi hybrid dengan backend proxy aman ke Sigen OpenAPI dan frontend React real-time.

## 🏗️ Arsitektur

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend       │────▶│  Sigen Cloud    │
│   React + Vite  │ WS  │  Node.js + Express│ HTTP│  API (Rate Ltd) │
│   Refresh 5s    │◀────│  Cache 5m + WS   │     │  1 req / 5 min  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## 📁 Struktur Folder

```
/workspace
├── backend/
│   ├── auth/
│   │   └── sigenAuth.js      # OAuth2 authentication
│   ├── proxy/
│   │   └── sigenApi.js       # API wrapper dengan rate limiting
│   ├── cache/
│   │   └── dataStore.js      # Cache & generator state
│   ├── ws/
│   │   └── broadcaster.js    # WebSocket broadcasting
│   ├── server.js             # Main Express server
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── hooks/
    │   │   └── useDashboardData.js  # WebSocket hook
    │   ├── components/
    │   │   ├── VesselList.jsx
    │   │   ├── EnergyFlowDiagram.jsx
    │   │   ├── RuntimeChart.jsx
    │   │   ├── VesselInfoPanel.jsx
    │   │   └── StatusBadge.jsx
    │   ├── utils/
    │   │   └── mapper.js       # Data transformation
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── .env.example
```

## 🚀 Cara Menjalankan

### 1. Setup Backend

```bash
cd /workspace/backend

# Install dependencies
npm install

# Copy environment file dan edit dengan kredensial Anda
cp .env.example .env
# Edit .env dengan SIGEN_APP_KEY dan SIGEN_APP_SECRET Anda

# Jalankan server
npm run dev
```

Server akan berjalan di `http://localhost:4000`

### 2. Setup Frontend

```bash
cd /workspace/frontend

# Install dependencies
npm install

# Copy environment file (opsional, sudah ada default)
cp .env.example .env.local

# Jalankan development server
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## 🔑 Konfigurasi Environment

### Backend (.env)
```env
SIGEN_APP_KEY=your_app_key_here
SIGEN_APP_SECRET=your_app_secret_here
PORT=4000
NODE_ENV=development
```

### Frontend (.env.local)
```env
VITE_WS_URL=ws://localhost:4000/ws
VITE_API_URL=http://localhost:4000/api
```

## 🧪 Testing Tanpa AppKey Asli

Backend menyediakan **mock data fallback** otomatis jika:
1. `SIGEN_APP_KEY` tidak dikonfigurasi
2. Request ke Sigen API gagal

Mock data akan menghasilkan:
- 3 vessel dummy (Alpha, Beta, Gamma)
- Realtime energy flow random yang berubah setiap 5 detik
- Historical data chart dengan data random

**Tidak perlu credentials untuk testing!** Cukup jalankan tanpa set `SIGEN_APP_KEY`.

## 📊 Fitur Utama

### Backend
- ✅ OAuth2 token management dengan auto-refresh
- ✅ Rate limit handling (error 1110) dengan exponential backoff
- ✅ Response caching dengan TTL 300 detik
- ✅ WebSocket broadcasting setiap 5 detik
- ✅ Generator runtime inference (gridPower < -2kW & batterySoc < 20%)
- ✅ Graceful degradation dengan stale cache

### Frontend
- ✅ Real-time dashboard dengan WebSocket
- ✅ Energy flow diagram visual
- ✅ Historical chart (7D/14D/30D)
- ✅ Dark/Light mode toggle
- ✅ Auto-reconnect WebSocket
- ✅ Mock data fallback
- ✅ Error boundary
- ✅ Responsive design

## 🔌 API Endpoints

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/systems` | GET | List semua vessel/system |
| `/api/system/:id/realtime` | GET | Realtime energy flow |
| `/api/system/:id/history` | GET | Historical data (query: period=7d\|14d\|30d) |
| `/api/cache/stats` | GET | Cache statistics (debugging) |
| `/health` | GET | Health check endpoint |
| `/ws` | WebSocket | Real-time data stream |

## 🎨 Komponen UI

1. **VesselList** - Sidebar dengan list vessel dan status
2. **EnergyFlowDiagram** - Diagram aliran energi PV→Battery/Grid/Load
3. **RuntimeChart** - Line chart historis dengan Recharts
4. **VesselInfoPanel** - Detail vessel terpilih
5. **StatusBadge** - Status monitoring, countdown, generator/battery indicator

## ⚙️ Business Logic

### Generator Inference
Generator dianggap ON ketika:
- `gridPower < -2000W` (import dari grid/generator)
- `batterySoc < 20%` (baterai rendah)

Runtime diakumulasi di backend dan ditampilkan dalam jam.

### Rate Limiting
- Backend fetch ke Sigen: **maksimal 1x per 5 menit**
- Frontend refresh UI: **setiap 5 detik** via WebSocket
- Countdown di UI menunjukkan waktu hingga fetch berikutnya

### Historical Data
- **7D**: Level = Day, 7 hari terakhir
- **14D**: Level = Day, 14 hari terakhir  
- **30D**: Level = Day, 30 hari terakhir

## 🛠️ Tech Stack

**Backend:**
- Node.js 18+
- Express.js
- WebSocket (ws)
- node-cache
- Axios
- dotenv

**Frontend:**
- React 18
- Vite
- TailwindCSS
- Recharts
- Axios

## 📝 Catatan Penting

1. **Rate Limit**: API Sigen membatasi 1 request per 5 menit per akun/stasiun
2. **Token Expiry**: OAuth token di-refresh otomatis sebelum expired (default 12 jam)
3. **Generator Runtime**: Diinferensi, bukan dari API langsung
4. **Mock Data**: Aktif otomatis jika tidak ada credentials atau API error

## 🔧 Troubleshooting

### Backend tidak bisa connect ke Sigen
- Pastikan `SIGEN_APP_KEY` dan `SIGEN_APP_SECRET` benar
- Cek koneksi internet
- Lihat log untuk error detail

### Frontend tidak connect ke WebSocket
- Pastikan backend running di port 4000
- Cek console browser untuk error WebSocket
- Verify `VITE_WS_URL` di .env.local

### Data tidak update
- Cek countdown di StatusBadge
- Lihat log backend untuk "Fetching fresh data"
- Verify cache tidak stale terlalu lama

## 📄 License

MIT License
