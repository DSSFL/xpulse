# X Pulse - Real-Time X (Twitter) Intelligence Dashboard

X Pulse is a real-time intelligence dashboard that streams and analyzes tweets from the X (Twitter) API, providing live sentiment analysis, threat velocity metrics, and geographic insights.

**Live Production Site:** https://www.xpulse.buzz
**Backend API:** https://api.xpulse.buzz

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    X (Twitter) API v2                            │
│                 Filtered Stream Endpoint                         │
└────────────────────────┬────────────────────────────────────────┘
                         │ Real-time tweets
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│               DigitalOcean Droplet (64.23.184.74)               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Backend Server (Node.js + Socket.io)                     │   │
│  │ - Streams tweets from X API                              │   │
│  │ - Performs sentiment analysis                            │   │
│  │ - Calculates threat velocity (tweets/min)                │   │
│  │ - Broadcasts metrics via WebSocket                       │   │
│  │ - Managed by PM2                                         │   │
│  │ - Port: 3001                                             │   │
│  │ - Domain: api.xpulse.buzz                                │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ WebSocket (Socket.io)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Vercel (joes-projects-30044879)                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Frontend (Next.js 14 + React + TypeScript)              │   │
│  │ - LiveDashboard component subscribes to WebSocket        │   │
│  │ - Displays real-time metrics and visualizations          │   │
│  │ - Auto-reconnection logic                                │   │
│  │ - Domain: www.xpulse.buzz                                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Infrastructure Details

### Backend Server (DigitalOcean Droplet)

**Server:** 64.23.184.74
**Access:** SSH via `ssh root@64.23.184.74`
**Backend Path:** `/root/xpulse/backend`
**Process Manager:** PM2
**Domain:** api.xpulse.buzz (via DNS A record)

#### Backend Technology Stack
- Node.js
- Express.js
- Socket.io (WebSocket server)
- Twitter API v2 Client
- Sentiment Analysis (natural language processing)

#### Backend Endpoints
- `GET /health` - Health check endpoint
- `WebSocket /socket.io` - Real-time metrics stream

### Frontend (Vercel)

**Domain:** www.xpulse.buzz
**Vercel Project:** xpulse-ne5o
**Organization:** joes-projects-30044879
**Framework:** Next.js 14 with App Router
**Deployment:** Automatic via GitHub integration

#### Frontend Technology Stack
- Next.js 14
- React 18
- TypeScript
- Socket.io-client
- Tailwind CSS
- Recharts (data visualization)

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Access to DigitalOcean droplet (for backend management)
- Vercel account (for frontend deployment)
- X (Twitter) API credentials (Bearer Token)

### Frontend Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xpulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```bash
   NEXT_PUBLIC_WS_URL=https://api.xpulse.buzz
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to http://localhost:3000

### Backend Setup (on Droplet)

1. **SSH into the droplet**
   ```bash
   ssh root@64.23.184.74
   ```

2. **Navigate to backend directory**
   ```bash
   cd /root/xpulse/backend
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```bash
   TWITTER_BEARER_TOKEN=<your-twitter-bearer-token>
   PORT=3001
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Start with PM2**
   ```bash
   pm2 start src/index.js --name xpulse-backend
   pm2 save
   ```

6. **Monitor the backend**
   ```bash
   pm2 logs xpulse-backend
   pm2 status
   ```

---

## Deployment

### Frontend Deployment (Vercel)

The frontend deploys automatically via GitHub integration:

1. **Push changes to GitHub**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Vercel auto-deploys**
   - Vercel detects the push
   - Builds the Next.js application
   - Deploys to www.xpulse.buzz
   - Environment variable `NEXT_PUBLIC_WS_URL` is set in Vercel dashboard

3. **Manual deployment (if needed)**
   ```bash
   npm run build
   vercel --prod
   ```

### Backend Deployment (Droplet)

1. **SSH into droplet**
   ```bash
   ssh root@64.23.184.74
   ```

2. **Navigate to backend directory**
   ```bash
   cd /root/xpulse/backend
   ```

3. **Pull latest changes**
   ```bash
   git pull origin main
   ```

4. **Install any new dependencies**
   ```bash
   npm install
   ```

5. **Restart PM2 process**
   ```bash
   pm2 restart xpulse-backend
   ```

6. **Verify it's running**
   ```bash
   pm2 logs xpulse-backend
   ```

---

## Monitoring and Testing

### Check Frontend Status

1. **Visit production site**
   ```bash
   open https://www.xpulse.buzz
   ```

2. **Check browser console** (Chrome DevTools)
   Look for `[XPULSE]` prefixed logs:
   - `✅ [XPULSE] Connected to backend` - WebSocket connected
   - `📊 [XPULSE] Metrics received` - Data flowing
   - `❌ [XPULSE] Connection error` - Connection issues

3. **Verify deployed bundle**
   ```bash
   curl -s "https://www.xpulse.buzz" | grep -o "page-[a-zA-Z0-9]*.js" | head -1
   ```

### Check Backend Status

1. **SSH into droplet**
   ```bash
   ssh root@64.23.184.74
   ```

2. **Check PM2 status**
   ```bash
   pm2 status
   pm2 logs xpulse-backend --lines 50
   ```

3. **Test WebSocket from terminal**
   From your local machine, run the included test script:
   ```bash
   node test-websocket.js
   ```

   Expected output:
   ```
   🔌 Connecting to backend: https://api.xpulse.buzz
   ✅ Connected to X Pulse backend
   Socket ID: <socket-id>
   📊 Metrics received: {
     tweetsPerMinute: 20,
     totalTweets: 931,
     sentiment: { positive: 392, neutral: 161, negative: 378 },
     ...
   }
   ```

4. **Check health endpoint**
   ```bash
   curl https://api.xpulse.buzz/health
   ```

5. **Monitor backend logs for client connections**
   ```bash
   ssh root@64.23.184.74 "pm2 logs xpulse-backend --lines 100" | grep -i "client"
   ```

---

## Key Components

### Frontend: `/src/components/LiveDashboard.tsx`

The main dashboard component that:
- Establishes WebSocket connection to backend via Socket.io
- Listens for `metrics:update` events
- Updates UI with real-time data
- Handles connection errors and reconnection
- Displays:
  - Threat Velocity (tweets/min)
  - Total Tweets
  - Sentiment Analysis (positive/negative/neutral)
  - Authenticity Score
  - Geographic heat map

**Key code snippet:**
```typescript
useEffect(() => {
  const backendUrl = process.env.NEXT_PUBLIC_WS_URL || 'https://api.xpulse.buzz';

  const socketInstance = io(backendUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socketInstance.on('connect', () => {
    console.log('✅ [XPULSE] Connected to backend');
    setIsConnected(true);
  });

  socketInstance.on('metrics:update', (metrics) => {
    console.log('📊 [XPULSE] Metrics received:', metrics);
    // Update state with metrics
  });
}, []);
```

### Backend: `/root/xpulse/backend/src/index.js`

The backend server that:
- Connects to X (Twitter) Filtered Stream API v2
- Performs sentiment analysis on incoming tweets
- Calculates threat velocity (tweets per minute)
- Broadcasts metrics to all connected clients via Socket.io
- Manages CORS for WebSocket connections

**Key features:**
- Real-time tweet streaming
- Sentiment classification (positive/negative/neutral)
- Metrics aggregation (total tweets, tweets/min, sentiment breakdown)
- WebSocket broadcasting every second
- Health check endpoint

---

## Troubleshooting

### Frontend Not Connecting to Backend

1. **Check browser console for errors**
   - Open Chrome DevTools (F12)
   - Look for `[XPULSE]` logs
   - Check for WebSocket errors

2. **Verify environment variable**
   ```bash
   # Check Vercel dashboard
   # Settings -> Environment Variables
   # NEXT_PUBLIC_WS_URL should be: https://api.xpulse.buzz
   ```

3. **Clear browser cache**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or clear cache in browser settings

4. **Test WebSocket from terminal**
   ```bash
   node test-websocket.js
   ```
   If this works but browser doesn't, it's a frontend issue.

### Backend Not Running

1. **SSH into droplet and check PM2**
   ```bash
   ssh root@64.23.184.74
   pm2 status
   ```

2. **Check logs for errors**
   ```bash
   pm2 logs xpulse-backend --lines 100
   ```

3. **Restart if needed**
   ```bash
   pm2 restart xpulse-backend
   ```

4. **Check if port is listening**
   ```bash
   netstat -tulpn | grep 3001
   ```

### No Tweets Coming In

1. **Check X API credentials**
   ```bash
   # On droplet
   cat /root/xpulse/backend/.env | grep TWITTER_BEARER_TOKEN
   ```

2. **Check backend logs for API errors**
   ```bash
   pm2 logs xpulse-backend | grep -i error
   ```

3. **Verify X API connection**
   Backend logs should show:
   ```
   ✅ Connected to X Streaming API
   📊 Tweet received: ...
   ```

### Deployment Not Updating

1. **Verify GitHub push succeeded**
   ```bash
   git log --oneline -5
   git remote -v
   ```

2. **Check Vercel deployment status**
   - Visit Vercel dashboard
   - Check deployment logs
   - Verify build succeeded

3. **Force redeploy**
   ```bash
   vercel --prod --force
   ```

---

## Project Structure

```
xpulse/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main page
│   │   └── layout.tsx            # Root layout
│   └── components/
│       ├── LiveDashboard.tsx     # Main dashboard component
│       ├── GlobalHeatMap.tsx     # Geographic visualization
│       ├── ThreatVelocity.tsx    # Velocity chart
│       └── ...
├── backend/                      # (On droplet at /root/xpulse/backend)
│   ├── src/
│   │   └── index.js             # Backend server
│   ├── package.json
│   └── .env                      # Backend environment variables
├── public/                       # Static assets
├── test-websocket.js            # WebSocket test script
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                    # Frontend environment variables
└── README.md                     # This file
```

---

## Environment Variables

### Frontend (`.env.local` or Vercel Dashboard)
```bash
NEXT_PUBLIC_WS_URL=https://api.xpulse.buzz
```

### Backend (on droplet: `/root/xpulse/backend/.env`)
```bash
TWITTER_BEARER_TOKEN=<your-twitter-bearer-token>
PORT=3001
```

---

## DNS Configuration

Both domains point to their respective servers:

- **www.xpulse.buzz** → Vercel (via CNAME)
- **api.xpulse.buzz** → 64.23.184.74 (via A record)

---

## Real-Time Data Flow

1. **X API Stream** → Backend receives tweets in real-time
2. **Sentiment Analysis** → Backend analyzes each tweet
3. **Metrics Aggregation** → Backend calculates totals, velocity, sentiment breakdown
4. **WebSocket Broadcast** → Backend emits `metrics:update` event every second
5. **Frontend Receives** → LiveDashboard component updates state
6. **UI Updates** → React re-renders with new metrics

---

## Support and Maintenance

### Accessing the Droplet
```bash
ssh root@64.23.184.74
```

### Checking Backend Status
```bash
pm2 status
pm2 logs xpulse-backend
```

### Restarting Backend
```bash
pm2 restart xpulse-backend
```

### Viewing Real-Time Logs
```bash
pm2 logs xpulse-backend --lines 100 --raw
```

### Testing WebSocket Connection
```bash
node test-websocket.js
```

---

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `npm run dev`
4. Commit and push to GitHub
5. Vercel will auto-deploy to preview URL
6. Test preview deployment
7. Merge to main for production deployment

---

## License

Proprietary - All rights reserved

---

## Contact

For issues or questions about the infrastructure, deployment, or codebase, please contact the development team.
