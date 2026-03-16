# ASTU PC Verify – Frontend

React + Vite + TypeScript + Tailwind CSS.

## Setup

```bash
cd frontend
npm install
```

## Scripts

- **`npm run dev`** – Start dev server
- **`npm run build`** – Production build
- **`npm run preview`** – Preview production build
- **`npm run lint`** – Run ESLint

## Folder structure

```
frontend/
├── public/           # Static assets (favicon, images)
├── src/
│   ├── assets/       # Images, fonts
│   ├── components/   # Reusable UI components
│   ├── config/       # App & env configuration
│   ├── features/     # Feature modules (auth, dashboard, profile)
│   ├── hooks/        # Custom React hooks
│   ├── layouts/      # Layout components
│   ├── pages/        # Route-level pages
│   ├── services/     # API and external services
│   ├── store/        # State management
│   ├── styles/       # Global styles
│   ├── types/        # TypeScript types
│   ├── utils/        # Helpers and constants
│   ├── App.tsx
│   ├── main.tsx
│   ├── router.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Environment

Create `.env` in `frontend/` for API URL:

```
VITE_API_URL=http://localhost:3000/api
```
