# Environment Configuration Guide

This project supports environment-based API configuration for development and production.

## Environment Files

- `.env` - Development environment (localhost)
- `.env.production` - Production environment (live server)

## API URLs

- **Development**: `http://localhost/school/backend/`
- **Production**: `https://ttss.webdekho.in/apis/`

## Usage

### Development (Local)
```bash
# Start development server with localhost API
npm start
# or explicitly
npm run start:dev
```

### Production Build
```bash
# Build for production with live server API
npm run build
# or explicitly
npm run build:prod
```

### Testing Production URLs Locally
```bash
# Start development server but use production API URLs
npm run start:prod
```

## Environment Variables

### Development (.env)
```
REACT_APP_API_BASE_URL=http://localhost/school/backend/
REACT_APP_ENV=development
```

### Production (.env.production)
```
REACT_APP_API_BASE_URL=https://ttss.webdekho.in/apis/
REACT_APP_ENV=production
```

## How It Works

1. The system automatically detects the environment
2. Uses the appropriate `.env` file
3. Fallback logic checks hostname if env vars are missing
4. API service uses the configured URL for all requests

## Console Logging

In development mode, you'll see console logs showing:
- Current API Base URL
- Environment being used
- Configuration details

These logs are disabled in production builds.