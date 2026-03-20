# LatexV

An AI-powered LaTeX editor that transforms natural language descriptions into professionally formatted LaTeX documents. Write in plain English, watch AI generate code in real-time, and download compiled PDFs instantly.

## Features

- **Natural Language Input**: Describe your document in plain English
- **Real-time Streaming**: Watch LaTeX code appear character by character
- **Auto-compilation**: Documents compile automatically after generation
- **Self-correction**: AI fixes compilation errors automatically (up to 3 retries)
- **Split-pane Editor**: Edit LaTeX on the left, preview PDF on the right
- **Session History**: All conversations saved for easy access
- **Instant PDF Export**: Download compiled documents immediately

## Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Custom CSS with CSS variables

**Backend**
- FastAPI (Python)
- LangGraph for AI agent orchestration
- Gemini API for LLM capabilities
- Celery for background task processing

**Infrastructure**
- Supabase (PostgreSQL + Storage)
- Upstash Redis (caching + sessions)
- pdflatex for document compilation

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Redis instance (Upstash recommended)
- Supabase account
- Gemini API key

### Backend Setup

```bash
cd backend
cp .env.example .env
# Configure your .env with API keys
uv sync
uv run uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to start using LatexV.

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `JWT_SECRET` | Secret for JWT token generation |

### Frontend (.env.local)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:8000) |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│    LLM      │
│  (Next.js)  │     │  (FastAPI)  │     │  (Gemini)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼─────┐ ┌─────▼─────┐
              │  Supabase │ │  Upstash  │
              │  (Storage │ │  (Redis)  │
              │   + DB)   │ │           │
              └───────────┘ └───────────┘
```

## API Reference

See [backend/README.md](backend/README.md) for detailed API documentation.

## License

MIT
