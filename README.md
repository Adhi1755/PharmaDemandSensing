# PharmaSens

PharmaSens is a full-stack medicine demand forecasting dashboard with a Next.js frontend and a Flask backend API.

## About The Project

PharmaSens is built to help healthcare teams plan medicine supply using data-driven demand forecasts instead of reactive ordering. The platform combines demand trends, model-based predictions, inventory visibility, and actionable insights in one workflow-focused dashboard.

In practical terms, it helps teams answer questions like:

- Which drugs are likely to see demand spikes in the next 7 to 30 days?
- Which locations are showing unusual consumption patterns?
- Where is stock likely to fall below safety levels?
- What reorder quantity is suggested to avoid shortage risk?

The current implementation is demo-ready and uses sample datasets so teams can evaluate the product flow, charts, and endpoint structure quickly before integrating real pharmacy or hospital data.

## Key Capabilities

- Demand forecasting per drug with selectable time horizons (7-day and 30-day).
- Inventory tracking with safety-stock comparison and reorder recommendations.
- Model performance visibility through forecasting metrics and feature importance.
- Insight feeds for trend anomalies, intermittent demand behavior, and regional demand views.
- Authentication flows for signup and login (in-memory for development).

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Recharts, GSAP
- Backend: Flask 3, Flask-CORS
- Data: In-memory sample data for dashboard, forecasting, inventory, and insights endpoints

## Project Structure

```text
.
|- src/                    # Next.js app and UI components
|  |- app/
|  |- components/
|  `- lib/api.ts           # Frontend API client
|- backend/
|  |- app.py               # Flask application entrypoint
|  |- routes/              # API route blueprints
|  `- data/sample_data.py  # Demo data providers
`- README.md
```

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.10+

## Setup

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Set frontend environment variable (optional)

The frontend defaults to `http://localhost:5001` for API calls.
If needed, override it in a local env file:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:5001" > .env.local
```

### 3. Install backend dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

## Running the App

Run backend and frontend in separate terminals.

### Terminal 1: backend

```bash
cd backend
source .venv/bin/activate
python app.py
```

Backend starts on `http://localhost:5001`.

### Terminal 2: frontend

```bash
npm run dev
```

Frontend starts on `http://localhost:3000`.

## Frontend Commands

```bash
npm run dev    # Start development server
npm run build  # Create production build
npm run start  # Start production server
npm run lint   # Run ESLint
```

## API Endpoints

### Health

- `GET /api/health`

### Auth

- `POST /api/signup`
- `POST /api/login`

### Dashboard

- `GET /api/dashboard-stats`
- `GET /api/top-drugs`
- `GET /api/alerts`
- `GET /api/trend-data`

### Forecast

- `GET /api/drugs`
- `GET /api/forecast?drug=<name>&horizon=7|30`

### Inventory

- `GET /api/inventory`

### Insights

- `GET /api/model-metrics`
- `GET /api/feature-importance`
- `GET /api/insights`
- `GET /api/location-insights?region=<name>`
- `GET /api/intermittent-demand`

## Notes

- Authentication uses an in-memory user store in `backend/routes/auth.py`.
- All backend responses are demo/sample driven and reset when the backend restarts.
- CORS is enabled for local frontend development.

## Troubleshooting

- If frontend API calls fail, verify the backend is running on port `5001`.
- If Python dependencies fail to install, ensure you are using Python 3.10+ in the virtual environment.
- If ports are busy, stop existing processes or update frontend API URL and backend port together.
