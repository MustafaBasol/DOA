# DOA Backend API

WhatsApp Chatbot Management System - Backend API

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (creates admin user)
npm run seed

# Start development server
npm run dev
```

### Default Credentials

After running seed:
- **Admin:** admin@autoviseo.com / Admin123!
- **Test Client:** test@example.com / Client123!

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `POST /api/users` - Create user
- `GET /api/users` - List users (paginated)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (soft)

### Profile (All users)
- `GET /api/users/profile/me` - Get own profile
- `PATCH /api/users/profile/me` - Update profile
- `PATCH /api/users/profile/password` - Change password

## 🔒 Security

- JWT authentication (15min access, 7day refresh)
- bcrypt password hashing (12 rounds)
- Rate limiting (100 req/15min)
- CORS protection
- Helmet security headers
- Input validation

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📦 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:studio` - Open Prisma Studio (DB GUI)
- `npm run seed` - Seed database

## 🛠️ Tech Stack

- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- JWT + bcrypt
- Joi validation
