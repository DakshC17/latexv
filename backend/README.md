# Backend API Documentation

FastAPI-based backend service for LatexV, handling AI-powered LaTeX document generation.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | User login |
| POST | `/auth/logout` | User logout |
| GET | `/auth/me` | Get current user |
| POST | `/v2/agent/stream` | Stream document generation |
| POST | `/v2/agent/async` | Async document generation |
| GET | `/status/{job_id}` | Get job status |
| POST | `/documents` | Create document |
| GET | `/documents/{doc_id}` | Get document |
| GET | `/documents` | List documents |
| DELETE | `/documents/{doc_id}` | Delete document |
| GET | `/conversations` | List conversations |
| GET | `/conversations/{conv_id}` | Get conversation |
| DELETE | `/conversations/{conv_id}` | Delete conversation |

## Authentication

The API uses session-based authentication with cookies. All endpoints except auth routes require a valid session.

### Auth Endpoints

#### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### POST /auth/login

Authenticate a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z"
}
```

Sets `session_id` cookie.

#### POST /auth/logout

End the current session.

**Response:**
```json
{
  "message": "Logged out"
}
```

#### GET /auth/me

Get the currently authenticated user.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Document Generation

### POST /v2/agent/stream

Generate a LaTeX document with real-time streaming via Server-Sent Events (SSE).

**Request Body:**
```json
{
  "prompt": "Write a resume template",
  "conversation_history": [
    {"role": "user", "content": "Previous prompt"},
    {"role": "assistant", "content": "Previous LaTeX response"}
  ]
}
```

**Response:** Server-Sent Events stream

**Event Data:**
```json
{
  "prompt": "Write a resume template",
  "latex": "\\documentclass{article}...",
  "status": "generating",
  "error": "",
  "pdf_path": "",
  "pdf_url": "",
  "retries": 0,
  "conversation_id": "uuid",
  "message": "Generating LaTeX code..."
}
```

**Status Values:**
- `planning`: Analyzing request
- `generating`: Creating LaTeX code
- `compiling`: Building PDF
- `fixing`: Self-correcting errors
- `done`: Success
- `failed`: After max retries

### POST /v2/agent/async

Submit a document generation job for background processing.

**Request Body:**
```json
{
  "prompt": "Write a research paper template"
}
```

**Response:**
```json
{
  "job_id": "uuid",
  "status": "pending",
  "message": "Job queued"
}
```

### GET /status/{job_id}

Check the status of an async job.

**Response:**
```json
{
  "job_id": "uuid",
  "status": "completed",
  "pdf_url": "https://...",
  "latex": "\\documentclass...",
  "error": null,
  "attempts": 1
}
```

## Document Management

### GET /documents

List all documents for the authenticated user.

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Resume Template",
    "prompt": "Write a resume template",
    "latex": "\\documentclass...",
    "pdf_url": "https://...",
    "status": "completed",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### POST /documents

Create a new document record.

**Request Body:**
```json
{
  "title": "My Document",
  "prompt": "Write a letter",
  "latex": "\\documentclass{letter}..."
}
```

### GET /documents/{doc_id}

Get a specific document by ID.

### DELETE /documents/{doc_id}

Delete a document by ID.

## Conversations

### GET /conversations

List all conversations for the authenticated user.

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Resume template request",
    "prompt": "Write a resume template",
    "latex": "\\documentclass...",
    "pdf_url": "https://...",
    "status": "completed",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### GET /conversations/{conv_id}

Get a specific conversation by ID.

### DELETE /conversations/{conv_id}

Delete a conversation by ID.

## Rate Limiting

The API implements rate limiting: 60 requests per 60 seconds per IP address.

**Response when rate limited (429):**
```json
{
  "detail": "Rate limit exceeded"
}
```

## Error Responses

Standard error response format:

```json
{
  "detail": "Error message description"
}
```

Common status codes:
- `400`: Bad Request
- `401`: Unauthorized (not authenticated)
- `404`: Not Found
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error
