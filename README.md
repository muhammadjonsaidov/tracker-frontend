# Tracker Frontend (Admin)

A React/Vite admin dashboard for real-time location tracking. It provides live map monitoring, session analytics, and user management on top of a REST API + SSE stream.

## Features

- Dashboard with key stats and weekly activity chart
- Live map with real-time location updates (SSE)
- Sessions list with status, paging, and detail view
- Session detail map with route, summary, and raw points table
- Users list with search and role badges
- Monitoring shortcuts for Prometheus and Grafana
- Admin-only access via JWT role check

## Tech Stack

- React 19 + React Router
- Vite
- Recharts
- Leaflet (via CDN in `index.html`)
- Tailwind (CDN)

## Requirements

- Node.js (LTS recommended)
- Backend API available for `/api/v1/...` endpoints

## Environment Variables

Create `.env.local` and set any of the following as needed:

- `VITE_API_BASE_URL` - API base URL (e.g. `http://localhost:8080`)
- `VITE_PROMETHEUS_URL` - Prometheus URL (optional)
- `VITE_GRAFANA_URL` - Grafana URL (optional)

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Notes

- Live map uses Leaflet loaded from CDN; internet access is required in the browser.
- Real-time updates use an SSE stream token from the API.
- The UI expects admin users (JWT contains `ADMIN` or `ROLE_ADMIN`).
