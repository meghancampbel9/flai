# 🛍️ Flai - AI-Powered Ecommerce Platform

An intelligent ecommerce platform built with React Native Expo and FastAPI, featuring AI-powered visual search, smart recommendations, and automated product discovery.

## 🏗️ Architecture

- **Frontend**: React Native Expo (iOS & Android)
- **Backend**: Python FastAPI with async support
- **Database**: Supabase (PostgreSQL) with pgvector for embeddings
- **AI/ML**: Google Gemini Vision API for image processing
- **Web Scraping**: Firecrawl for automated product discovery
- **Monorepo**: Turborepo with PNPM workspaces

## 📁 Project Structure

```
flai/
├── 📱 apps/
│   ├── mobile/          # React Native Expo app
│   └── api/             # Python FastAPI backend
├── 📚 packages/
│   ├── shared-types/    # Shared TypeScript definitions
│   ├── ui/              # Shared UI components
│   ├── eslint-config/   # ESLint configuration
│   └── typescript-config/ # TypeScript configuration
├── docker-compose.yml   # Local development services
└── turbo.json          # Turborepo configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and PNPM
- Python 3.11+
- Docker and Docker Compose
- Expo CLI (`npm install -g @expo/cli`)

### 1. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Install Python dependencies for API
cd apps/api
pip install -r requirements.txt
cd ../..
```

### 2. Environment Setup

Create environment files (these are blocked by .gitignore for security):

**Root `.env`:**
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/flai_dev
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Redis
REDIS_URL=redis://localhost:6379

# AI Services
GOOGLE_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Web Scraping
FIRECRAWL_API_KEY=your_firecrawl_api_key

# JWT
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30
```

**Mobile app `.env` (apps/mobile/.env):**
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start Development Services

```bash
# Start database and Redis
docker-compose up -d postgres redis

# Start the entire development environment
pnpm dev

# Or start services individually:
pnpm dev:mobile    # React Native Expo
pnpm dev:api       # FastAPI backend
```

### 4. Access Applications

- **Mobile App**: Expo Go app or web browser at `http://localhost:8081`
- **API Documentation**: `http://localhost:8000/docs`
- **API Health Check**: `http://localhost:8000/health`

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start all apps
pnpm dev:mobile       # Start mobile app only
pnpm dev:api          # Start API only

# Building
pnpm build            # Build all apps
pnpm build:mobile     # Build mobile app
pnpm build:api        # Build API

# Linting & Type Checking
pnpm lint             # Lint all code
pnpm check-types      # Type check all TypeScript
pnpm format           # Format code with Prettier

# Testing
pnpm test             # Run all tests

# Mobile specific
pnpm mobile           # Start Expo development server
cd apps/mobile && npx expo run:ios     # Run on iOS simulator
cd apps/mobile && npx expo run:android # Run on Android emulator

# API specific
pnpm api              # Start FastAPI server directly
cd apps/api && python main.py         # Alternative way to start API
```

## 🔧 Technology Stack

### Frontend (React Native Expo)
- **Framework**: Expo SDK 50+
- **Navigation**: Expo Router
- **UI**: Expo UI Kit + TailwindCSS (NativeWind)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Image Processing**: Expo Image Picker

### Backend (Python FastAPI)
- **Framework**: FastAPI with async/await
- **Database**: SQLAlchemy with async support
- **Authentication**: JWT with Supabase Auth
- **AI/ML**: Google Gemini Vision, scikit-learn
- **Web Scraping**: Firecrawl API
- **Background Tasks**: Celery + Redis

### Database & Storage
- **Primary DB**: Supabase (PostgreSQL)
- **Vector Store**: pgvector for embeddings
- **File Storage**: Supabase Storage
- **Caching**: Redis

## 🤖 AI Features

- **Visual Search**: Upload images to find similar products
- **Smart Recommendations**: ML-powered product suggestions
- **Auto Categorization**: AI-powered product classification
- **Web Scraping**: Automated product discovery from e-commerce sites

## 🚢 Deployment

### Mobile App
```bash
# Build for production
cd apps/mobile
npx expo build:ios     # iOS App Store
npx expo build:android # Google Play Store
```

### API Backend
```bash
# Build Docker image
docker build -t flai-api ./apps/api

# Deploy to cloud provider
# (Add specific deployment instructions for your chosen platform)
```

## 📚 API Documentation

Once the API is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**PNPM installation fails:**
```bash
npm install -g pnpm
```

**Expo app won't start:**
```bash
cd apps/mobile
npx expo install --fix
```

**Python dependencies fail:**
```bash
cd apps/api
pip install --upgrade pip
pip install -r requirements.txt
```

**Database connection issues:**
```bash
docker-compose down
docker-compose up -d postgres
```

For more help, check the [docs](./docs) folder or open an issue.
