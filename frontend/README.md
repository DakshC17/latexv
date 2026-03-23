# Frontend Documentation

Next.js-based frontend for LatexV AI-powered LaTeX editor.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Landing page
│   │   ├── globals.css         # Global styles
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   ├── register/
│   │   │   └── page.tsx        # Registration page
│   │   └── app/
│   │       ├── layout.tsx      # App layout with header
│   │       └── editor/
│   │           └── page.tsx    # Main editor page
│   ├── components/
│   │   └── Sidebar.tsx        # Sidebar navigation
│   └── lib/
│       ├── api.ts              # API client
│       └── auth.tsx            # Auth context provider
└── public/
    └── favicon.svg             # Site favicon
```

## Pages

### Landing Page (`/`)

Public landing page with:
- Hero section with product description
- Features grid (6 features)
- How it works section (3 steps)
- Call to action
- Professional footer with links

### About (`/about`)

Company/product information page with:
- Problem statement
- Solution explanation
- Key features list
- Target audience

### Contact (`/contact`)

Contact form with:
- Name, email, subject, message fields
- Form validation
- Success/error states
- Email to: quantumbyte.co.in@gmail.com
- Alternative: direct mailto link

### Login (`/login`)

Authentication form with:
- Email/password fields
- Error handling
- Link to registration

### Register (`/register`)

Registration form with:
- Email/password fields
- Password validation (min 6 characters)
- Error handling
- Link to login

### Editor (`/app/editor`)

Main application interface featuring:
- Split-pane layout (50/50)
- Left: LaTeX code editor with streaming
- Right: PDF preview
- Floating Compile button
- Status bar showing generation progress
- Session history sidebar

### Terms (`/terms`)

Legal terms of service page with:
- Acceptance of terms
- Use of service guidelines
- Account responsibility
- Intellectual property policy

### Privacy (`/privacy`)

Privacy policy page with:
- Information collection practices
- Data storage details
- Cookie usage
- User rights
- Security measures

### 404 (`/not-found`)

Custom 404 error page with:
- Clean error message
- Navigation links

## Components

### Sidebar

- Hamburger menu button (hides when sidebar open)
- Sessions list with conversation history
- New chat button
- Settings panel
- User info with logout

### AuthProvider

React context providing:
- `user`: Current user object or null
- `loading`: Authentication loading state
- `login()`: Login function
- `register()`: Registration function
- `logout()`: Logout function

## API Integration

### api.agent.stream()

Streams document generation in real-time.

```typescript
const result = await api.agent.stream(
  prompt: string,
  onChunk: (data: AgentEvent) => void,
  conversationHistory: Array<{role: string; content: string}>
);
```

### api.auth

- `login(email, password)`
- `register(email, password)`
- `logout()`
- `me()`

### api.conversations

- `list()`: Get all conversations
- `get(id)`: Get specific conversation
- `delete(id)`: Delete conversation

## State Management

Editor page manages:
- `prompt`: Current user input
- `latexCode`: Generated/stored LaTeX code
- `pdfUrl`: Compiled PDF URL
- `status`: Generation status (idle, planning, generating, compiling, fixing, done, error)
- `conversationHistory`: Recent messages for AI context
- `currentConversationId`: Active session ID

## Styling

Uses CSS variables for theming:

```css
--bg-base        /* Main background */
--bg-surface    /* Card/panel background */
--accent        /* Primary accent color (amber) */
--text-primary  /* Primary text */
--text-secondary /* Secondary text */
--border        /* Border color */
```

## Scripts

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Start production server
```
