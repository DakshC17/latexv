<div align="center">

# LatexV

**AI-Powered LaTeX Document Generation Platform**

Transform natural language into professionally formatted LaTeX documents with real-time streaming and intelligent error correction.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#features) • [Architecture](#architecture) • [Quick Start](#quick-start) • [Deployment](#deployment) • [API Docs](backend/README.md) • [Agent Metrics](AGENT_METRICS.md) • [Benchmarks](BENCHMARKS.md) • [Problem Specialization](PROBLEM_SPECIALIZATION.md)

</div>

---

## Overview

LatexV is a production-grade web application that leverages AI to democratize LaTeX document creation. Users describe their desired documents in natural language, and the platform generates, compiles, and delivers publication-ready PDFs with intelligent error correction.

**[→ Read about the problem we solve](PROBLEM_SPECIALIZATION.md)**  
**[→ See agent performance metrics (8,247/10,000)](AGENT_METRICS.md)**  
**[→ View benchmarks vs default Cursor Claude](BENCHMARKS.md)**

### Key Capabilities

- **Natural Language Processing**: Converts plain English descriptions into valid LaTeX code
- **Real-time Streaming**: Character-by-character code generation with visual feedback
- **Autonomous Compilation**: Automatic PDF generation with up to 3 retry attempts for error correction
- **Contextual Memory**: Maintains conversation history for iterative document refinement
- **Version Control**: Tracks all document iterations with full revision history
- **Session Management**: Secure authentication with Redis-backed sessions
- **Rate Limiting**: Built-in protection against API abuse (60 requests per minute)

## Features

### For Users

| Feature | Description |
|---------|-------------|
| **Natural Language Input** | Describe documents in plain English without LaTeX knowledge |
| **Real-time Streaming** | Watch LaTeX code appear character by character as AI generates |
| **Auto-compilation** | PDFs compile automatically after generation completes |
| **Agentic Self-correction** | AI autonomously fixes compilation errors (max 3 retries) |
| **Split-pane Editor** | Edit LaTeX code on left, preview PDF on right in real-time |
| **Manual Editing** | Full LaTeX editor with syntax support for manual refinement |
| **Session History** | Browse and resume previous conversations with context preservation |
| **Conversation Memory** | AI remembers last 5 messages within each session |
| **Instant PDF Export** | Download compiled documents with a single click |

### For Developers

- **RESTful API**: Comprehensive FastAPI endpoints with OpenAPI documentation
- **Streaming SSE**: Server-Sent Events for real-time updates
- **Async Processing**: Celery-based background job queue for heavy tasks
- **Type Safety**: Full TypeScript frontend and Pydantic backend validation
- **Error Handling**: Graceful degradation with detailed error messages
- **Database Migrations**: Managed PostgreSQL schema with Supabase

## Tech Stack

<table>
<tr>
<td width="50%" valign="top">

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Custom CSS with CSS Variables
- **State Management**: React Hooks
- **HTTP Client**: Native Fetch API
- **SSE Handling**: EventSource API

</td>
<td width="50%" valign="top">

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **AI Orchestration**: LangGraph
- **LLM Provider**: Google Gemini 2.5 Flash
- **Task Queue**: Celery
- **LaTeX Compiler**: pdflatex (TeX Live)

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Infrastructure
- **Database**: Supabase PostgreSQL
- **File Storage**: Supabase Storage
- **Cache/Sessions**: Upstash Redis
- **Package Manager**: uv (backend), npm (frontend)

</td>
<td width="50%" valign="top">

### DevOps
- **Version Control**: Git
- **Environment Management**: dotenv
- **API Documentation**: OpenAPI/Swagger
- **Process Management**: Uvicorn (ASGI)

</td>
</tr>
</table>

## Quick Start

### Prerequisites

Ensure you have the following installed and configured:

- **Python 3.11+** - Backend runtime
- **Node.js 18+** - Frontend runtime
- **uv** - Python package manager ([installation guide](https://github.com/astral-sh/uv))
- **TeX Live** - For pdflatex compiler ([installation guide](https://www.tug.org/texlive/))
- **Supabase Account** - PostgreSQL database and file storage ([sign up](https://supabase.com))
- **Upstash Account** - Redis instance ([sign up](https://upstash.com))
- **Google AI Studio** - Gemini API key ([get key](https://aistudio.google.com/app/apikey))

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/yourusername/latexv.git
cd latexv
```

#### 2. Backend Setup

```bash
cd backend

# Create and configure environment file
cp .env.example .env
# Edit .env with your API keys and credentials

# Install dependencies
uv sync

# Run database migrations (via Supabase dashboard)
# Execute SQL from backend/db/schema.sql in Supabase SQL editor

# Start development server
uv run uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Verification

1. Open `http://localhost:3000` in your browser
2. Click "Get Started" to register a new account
3. After login, try generating a document:
   - Example prompt: "Create a simple resume for a software engineer"
4. Watch the LaTeX code stream in real-time
5. PDF should automatically compile and appear in the right pane
6. Click "Download PDF" to save the document

## Environment Variables

### Backend Configuration

Create `backend/.env` with the following variables:

```bash
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

# Security
JWT_SECRET=your_random_jwt_secret_min_32_chars

# Optional: Celery Configuration (for async processing)
CELERY_BROKER_URL=rediss://default:your_password@your-redis.upstash.io:6379
CELERY_RESULT_BACKEND=rediss://default:your_password@your-redis.upstash.io:6379
```

### Frontend Configuration

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, update to your deployed backend URL.

## Development

### Running Tests

```bash
# Backend tests (coming soon)
cd backend
uv run pytest

# Frontend tests (coming soon)
cd frontend
npm test
```

### Code Style

Backend follows PEP 8 with Black formatting:
```bash
cd backend
uv run black .
uv run ruff check .
```

Frontend follows Next.js conventions with ESLint:
```bash
cd frontend
npm run lint
```

### Database Migrations

All database schema changes should be made via Supabase SQL editor. Run the SQL commands from `backend/db/schema.sql` to set up tables.

### Hot Reload

Both frontend and backend support hot reload during development:
- **Backend**: Uvicorn watches for Python file changes
- **Frontend**: Next.js Fast Refresh updates on save

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                           │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Landing Page  │  │  Auth Pages     │  │  Editor App     │  │
│  │  (Marketing)   │  │  (Login/Signup) │  │  (Main UI)      │  │
│  └────────────────┘  └─────────────────┘  └─────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend (Python)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes Layer                                         │  │
│  │  • /auth/* (login, register, logout)                     │  │
│  │  • /generate (streaming SSE endpoint)                    │  │
│  │  • /generate-async (background job queue)                │  │
│  │  • /conversations/* (CRUD operations)                    │  │
│  │  • /compile (manual recompilation)                       │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │  Middleware Stack                                         │  │
│  │  1. CORS (handles preflight & headers)                   │  │
│  │  2. Rate Limiter (60 req/min per IP via Redis)           │  │
│  │  3. Auth Middleware (validates session tokens)           │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │  LangGraph Agent (AI Orchestration)                      │  │
│  │  • StateGraph: generate_latex → compile → fix_errors    │  │
│  │  • Max 3 retry iterations for error correction           │  │
│  │  • Conversation history context (last 5 messages)        │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │  Services Layer                                           │  │
│  │  • LaTeX Compiler (pdflatex subprocess)                  │  │
│  │  • Storage Service (Supabase file uploads)               │  │
│  │  • Database Queries (async PostgreSQL operations)        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Gemini API      │  │  Supabase        │  │  Upstash Redis   │
│  (LLM Provider)  │  │  • PostgreSQL    │  │  • Sessions      │
│  • gemini-2.5-   │  │  • File Storage  │  │  • Rate Limits   │
│    flash model   │  │  • 4 tables:     │  │  • Celery Broker │
│  • Streaming     │  │    - users       │  │                  │
│    responses     │  │    - documents   │  │                  │
│                  │  │    - versions    │  │                  │
│                  │  │    - convos      │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Data Flow

#### Document Generation Flow
1. **User Input**: User submits natural language prompt via frontend
2. **Authentication**: Backend validates session token from Redis
3. **Rate Check**: Verifies request count under limit (60/min)
4. **LLM Streaming**: Gemini API generates LaTeX code character-by-character
5. **SSE Push**: Backend streams code to frontend via Server-Sent Events
6. **Compilation**: pdflatex compiles LaTeX to PDF (auto-triggered)
7. **Error Handling**: If compilation fails, agent retries with error context (max 3x)
8. **Storage**: Final PDF uploaded to Supabase Storage
9. **Database**: Document and conversation records saved to PostgreSQL
10. **Response**: Frontend displays PDF in iframe with download option

#### Session Management Flow
1. User registers/logs in via `/auth/register` or `/auth/login`
2. Backend creates session ID and stores in Redis (24h TTL)
3. Session token returned as HTTP-only cookie
4. All subsequent requests include cookie for authentication
5. AuthMiddleware validates token on each request
6. Logout deletes Redis session and clears cookie

### Database Schema

```sql
-- Users table (custom, not auth.users)
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Conversations table
conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Documents table
documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  conversation_id UUID REFERENCES conversations(id),
  prompt TEXT NOT NULL,
  latex_code TEXT NOT NULL,
  pdf_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
)

-- Document versions table
document_versions (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  latex_code TEXT NOT NULL,
  pdf_url TEXT,
  version_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Deployment

### Production Considerations

#### Backend Deployment

**Recommended Platform**: Railway, Render, or AWS ECS

1. **Environment Setup**
   - Set all environment variables in platform dashboard
   - Use production Redis URL (rediss:// protocol)
   - Enable HTTPS for all external endpoints

2. **Build Configuration**
   ```bash
   # Install TeX Live in container
   apt-get update && apt-get install -y texlive-latex-base texlive-fonts-recommended
   
   # Install Python dependencies
   pip install uv
   uv sync --frozen
   
   # Start production server
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **Scaling Considerations**
   - Run multiple Uvicorn workers for concurrent requests
   - Use Redis for session sharing across instances
   - Consider Celery workers for background job processing
   - Set up health check endpoint: `GET /health`

4. **Security**
   - Enable HTTPS/TLS
   - Set strong JWT_SECRET (min 32 random characters)
   - Use Supabase RLS (Row Level Security) policies
   - Configure CORS to only allow your frontend domain
   - Enable rate limiting per user (not just IP)

#### Frontend Deployment

**Recommended Platform**: Vercel (optimal for Next.js)

1. **Build Configuration**
   ```bash
   npm run build
   npm start
   ```

2. **Environment Variables**
   - Set `NEXT_PUBLIC_API_URL` to production backend URL
   - Ensure HTTPS is used for API communication

3. **Optimizations**
   - Enable Next.js Static Optimization for landing page
   - Use CDN for static assets
   - Configure caching headers for PDFs
   - Enable image optimization (if images added later)

#### Database Setup

1. **Supabase Configuration**
   - Run all migrations from `backend/db/schema.sql`
   - Set up Row Level Security policies:
     ```sql
     -- Users can only read their own data
     CREATE POLICY "Users can view own data" ON documents
       FOR SELECT USING (auth.uid() = user_id);
     
     CREATE POLICY "Users can insert own data" ON documents
       FOR INSERT WITH CHECK (auth.uid() = user_id);
     ```
   - Enable realtime (optional, for future features)
   - Configure backup schedule

2. **Storage Buckets**
   - Create `pdfs` bucket for document storage
   - Set public read access for authenticated users
   - Configure automatic cleanup for old files (optional)

#### Monitoring

- **Error Tracking**: Integrate Sentry for error monitoring
- **Logging**: Use structured logging (JSON format)
- **Metrics**: Track:
  - API response times
  - Document generation success rate
  - Compilation error frequency
  - Active user sessions
- **Alerting**: Set up alerts for:
  - API downtime
  - High error rates
  - Redis connection failures
  - Database connection issues

### Docker Deployment (Optional)

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install uv

WORKDIR /app
COPY backend/ .

# Install dependencies
RUN uv sync --frozen

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - backend/.env
    depends_on:
      - redis
  
  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## API Documentation

Interactive API documentation is available when running the backend:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

For detailed endpoint documentation, see [backend/README.md](backend/README.md).

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Create new user account |
| `/auth/login` | POST | Authenticate and create session |
| `/auth/logout` | POST | Destroy session |
| `/generate` | POST | Generate LaTeX document (streaming SSE) |
| `/generate-async` | POST | Generate document (background job) |
| `/compile` | POST | Manually recompile LaTeX code |
| `/conversations` | GET | List all user conversations |
| `/conversations/{id}` | GET | Get specific conversation details |
| `/conversations/{id}` | DELETE | Delete conversation |

## Project Structure

```
latexv/
├── backend/
│   ├── agents/              # LangGraph agent definitions
│   ├── api/                 # FastAPI route handlers
│   ├── auth/                # Authentication logic
│   ├── cache_redis/         # Redis utilities
│   ├── db/                  # Database models and queries
│   ├── graph/               # LangGraph nodes and state
│   ├── models/              # Pydantic request/response models
│   ├── tools/               # LaTeX compiler and utilities
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   └── pyproject.toml       # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── app/         # Protected application routes
│   │   │   ├── login/       # Login page
│   │   │   ├── register/    # Registration page
│   │   │   └── page.tsx     # Landing page
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities and API client
│   ├── public/              # Static assets
│   └── package.json         # Node.js dependencies
│
└── README.md                # This file
```

## Cursor IDE Configuration

This project includes a comprehensive `.cursorrules` file that configures the AI agent with:
- Project-specific architecture knowledge
- Critical bug fixes and common pitfalls
- Coding standards and conventions
- Performance optimization patterns
- Security best practices

**Benefits of using LatexV Agent (with .cursorrules):**
- **40% better performance** than default Cursor Claude
- **45% faster development** time
- **82% fewer errors** introduced
- Instant answers for documented issues

**[→ View full benchmarks](BENCHMARKS.md)**

To use with Cursor IDE, the `.cursorrules` file is automatically loaded when you open this project.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow code style**: Black for Python, ESLint for TypeScript
3. **Write tests** for new features (when test suite is available)
4. **Update documentation** for API changes
5. **Submit a pull request** with a clear description

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test locally
# Backend: uvicorn main:app --reload
# Frontend: npm run dev

# Commit with descriptive messages
git commit -m "feat: add conversation export functionality"

# Push and create PR
git push origin feature/your-feature-name
```

## Troubleshooting

### Common Issues

#### "Module 'redis' not found"
- **Cause**: Local directory shadowing PyPI package
- **Solution**: Renamed `backend/redis/` to `backend/cache_redis/`

#### CORS errors on login/register
- **Cause**: AuthMiddleware returning 401 before CORS headers added
- **Solution**: Reversed middleware order (CORS before Auth)

#### Celery not picking up jobs
- **Cause**: Using HTTPS Redis URL instead of wire protocol
- **Solution**: Use `rediss://` URL format, not `https://`

#### First request always succeeds rate limit
- **Cause**: Using SETEX without INCR
- **Solution**: Use INCR + EXPIRE pattern

#### LaTeX compilation fails
- **Cause**: Missing packages or special characters
- **Solution**: System prompt restricts to guaranteed packages only

#### Session not found after login
- **Cause**: Redis connection issue or wrong URL format
- **Solution**: Verify `UPSTASH_REDIS_REST_URL` and token are correct

### Getting Help

- Check [backend/README.md](backend/README.md) for API documentation
- Check [frontend/README.md](frontend/README.md) for component details
- Review closed issues for similar problems
- Open a new issue with reproduction steps

## Roadmap

### Planned Features
- [ ] Document templates library (resume, paper, presentation)
- [ ] Collaborative editing (real-time multi-user)
- [ ] Export to Overleaf
- [ ] LaTeX package manager (select specific packages)
- [ ] Syntax highlighting in code editor
- [ ] Advanced PDF preview (zoom, annotations)
- [ ] Mobile responsive editor
- [ ] Public document sharing (via unique links)
- [ ] Document analytics (compilation time, error frequency)

### Future Improvements
- [ ] WebSocket support for faster streaming
- [ ] Custom LLM fine-tuning for LaTeX generation
- [ ] A/B testing for prompt engineering
- [ ] Usage analytics dashboard
- [ ] API rate tier system (free/pro)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Google Gemini** for LLM capabilities
- **Supabase** for database and storage infrastructure
- **Upstash** for Redis hosting
- **FastAPI** for the excellent async framework
- **Next.js** for the React framework
- **LangGraph** for AI agent orchestration

---

<div align="center">

**Just for the LaTeX community**

[Report Bug](https://github.com/yourusername/latexv/issues) • [Request Feature](https://github.com/yourusername/latexv/issues)

</div>
