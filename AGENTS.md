# AGENTS.md - Development Guidelines for Agentic Coding

This document provides guidance for AI agents working on this codebase.

## Project Overview

- **Project Name**: Event Ticket Management (TicketHub)
- **Type**: React Single Page Application (SPA)
- **Core Functionality**: Online event ticket booking platform with admin management
- **Tech Stack**: React 19, Vite, Tailwind CSS, Zustand, React Router, Lucide React

## Build & Development Commands

```bash
# Development
npm run dev           # Start Vite dev server on port 3000

# Production
npm run build         # Build for production
npm run preview       # Preview production build

# Backend (if running separately)
npm run dev           # Start Express server with nodemon (port 8000)
```

**Note**: There is no configured linting (ESLint) or testing framework (Vitest/Jest) in this project.

## Code Style Guidelines

### General Conventions

- Use functional components with hooks (no class components)
- Use `.jsx` extension for React components
- Use PascalCase for component names (e.g., `HomePage.jsx`)
- Use camelCase for variables, functions, and file names
- Use `const` over `let`, avoid `var`

### Imports

```javascript
// React core imports first
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

// Third-party library imports
import { Search, MapPin, Menu } from 'lucide-react'
import useAuthStore from '../../store/authStore.js'

// Relative imports (grouped by distance)
import Layout from './components/layout/Layout.jsx'
import HomePage from './pages/HomePage'
```

- Use the `@` alias for src-relative imports: `import Button from '@/components/Button'`
- Use explicit `.jsx` extension for relative imports within src

### Components

- Components should be self-contained where possible
- Use composition over inheritance
- Keep components focused on a single responsibility
- Extract inline styles to Tailwind classes when possible

### State Management (Zustand)

```javascript
// Store file pattern
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStoreName = create(
  persist(
    (set) => ({
      // state
      // actions
    }),
    { name: 'storage-key' }
  )
)

export default useStoreName
```

### Routing (React Router)

- Use `Routes` and `Route` components
- Define routes in `App.jsx` at the root
- Use `<Outlet />` for nested layouts
- Wrap protected routes with `ProtectedRoute` component

```javascript
<Route
  path="protected-path"
  element={
    <ProtectedRoute>
      <Component />
    </ProtectedRoute>
  }
/>
```

### Styling

- Use Tailwind CSS classes primarily
- Use inline styles only when necessary (dynamic styles, complex animations)
- Follow Tailwind config color scheme:
  - Primary colors: gray-50 to gray-950
  - Accent: indigo-500 to indigo-700
  - Orange accent for highlights: orange-500/600
- Use `clsx` and `tailwind-merge` for conditional classes:

```javascript
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Usage
<div className={cn('base-class', isActive && 'active-class')} />
```

### Types

This project uses JavaScript (not TypeScript). When adding type hints:
- Use JSDoc comments for complex types
- Document props for components

```javascript
/**
 * @param {Object} props
 * @param {string} props.title
 * @param {number} props.count
 */
function Component({ title, count }) { }
```

### Error Handling

- Use try/catch for async operations
- Display user-friendly error messages via toast notifications
- Handle API errors gracefully with fallbacks

```javascript
try {
  const response = await apiCall()
} catch (error) {
  toast.error('Something went wrong')
  console.error(error)
}
```

### Naming Conventions

- **Components**: `PascalCase` (e.g., `Navbar.jsx`, `EventCard.jsx`)
- **Files**: `camelCase` (e.g., `api.js`, `authStore.js`)
- **CSS Classes**: `kebab-case` (standard Tailwind)
- **Constants**: `UPPER_SNAKE_CASE` for configuration values
- **Functions**: `camelCase` with verb prefix (`handleSubmit`, `fetchData`)

### File Organization

```
src/
├── components/       # Reusable UI components
│   ├── layout/       # Layout components (Navbar, Footer, Layout)
│   └── events/       # Event-specific components
├── config/           # Configuration files (api.js, db.js)
├── models/           # Data models/types
├── pages/            # Page components
│   ├── auth/         # Authentication pages
│   └── admin/        # Admin pages
├── store/            # Zustand stores
├── middleware/       # Route middleware
├── data/             # Mock data
└── main.jsx          # App entry point
```

### API Integration

- API base URL configured in `src/config/api.js`
- Use environment variables: `import.meta.env.VITE_*`
- Default fallback to production URL if env not set

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://production-url.com'
```

### Protected Routes

- Use `ProtectedRoute` component for authenticated routes
- Check `isAuthenticated` from `authStore`
- Redirect to `/login` if not authenticated

## Environment Variables

Create `.env` in project root:

```env
VITE_API_URL=http://localhost:8000
VITE_STRIPE_PUBLIC_KEY=your_stripe_key
```

## Common Patterns

### Conditional Classes

```javascript
<div className={isActive ? 'bg-orange-500 text-white' : 'bg-gray-200'} />
```

### Conditional Rendering

```javascript
{isAuthenticated ? (
  <UserMenu />
) : (
  <LoginButton />
)}
```

### List Rendering

```javascript
{items.map((item) => (
  <Card key={item.id} data={item} />
))}
```

### Form Handling

```javascript
const [formData, setFormData] = useState({ name: '', email: '' })

const handleChange = (e) => {
  const { name, value } = e.target
  setFormData(prev => ({ ...prev, [name]: value }))
}
```

## Notes for AI Agents

1. **No testing framework** - Add Vitest + React Testing Library if tests are needed
2. **No ESLint/Prettier** - Consider adding for better code quality
3. **Inline styles** - Some components (like Navbar) use heavy inline styles - prefer Tailwind
4. **No TypeScript** - Maintain JSDoc patterns if type information needed
5. **Vite proxy** - API calls to `/api/*` proxy to `http://localhost:8000`