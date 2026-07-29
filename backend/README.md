# ResumeAI Pro - Backend API

Full-stack backend for ResumeAI Pro with authentication, AI integration, payments, and security.

## 🏗️ Architecture

```
backend/
├── src/
│   ├── server.js           # Express server entry
│   ├── routes/
│   │   ├── auth.js         # Auth (register, login, reset)
│   │   ├── users.js        # User profile & stats
│   │   ├── resumes.js      # Resume CRUD
│   │   ├── templates.js    # Template management
│   │   ├── ai.js           # AI generation endpoints
│   │   └── payments.js     # Stripe payments
│   ├── middleware/
│   │   ├── auth.js         # JWT protection
│   │   ├── rateLimiter.js  # Rate limiting
│   │   ├── validator.js    # Input validation
│   │   └── errorHandler.js # Global error handling
│   ├── models/
│   │   └── database.js     # SQLite DB + schema
│   ├── services/
│   │   ├── ai.js           # OpenAI/Anthropic integration
│   │   └── email.js        # SMTP email service
│   └── utils/
│       └── logger.js       # Winston logging
├── config/
│   └── .env.example        # Environment template
├── package.json
└── README.md
```

## 🚀 Quick Start

```bash
cd backend
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Start server
npm run dev
```

Server runs on `http://localhost:5000`

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password` | Reset password |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get profile |
| PUT | `/api/users/profile` | Update profile |
| GET | `/api/users/stats` | Dashboard stats |
| DELETE | `/api/users/account` | Delete account |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resumes` | List resumes |
| POST | `/api/resumes` | Create resume |
| GET | `/api/resumes/:id` | Get resume |
| PUT | `/api/resumes/:id` | Update resume |
| DELETE | `/api/resumes/:id` | Delete resume |
| POST | `/api/resumes/:id/duplicate` | Duplicate |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate` | AI content generation |
| POST | `/api/ai/optimize-ats` | ATS optimization |
| POST | `/api/ai/extract-keywords` | JD keyword extraction |
| GET | `/api/ai/generations` | Generation history |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List templates |
| GET | `/api/templates/:id` | Get template |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments/plans` | Available plans |
| POST | `/api/payments/create-intent` | Create payment |
| GET | `/api/payments/history` | Payment history |
| POST | `/api/payments/cancel` | Cancel subscription |

## 🔐 Security Features

- **Helmet** - Secure HTTP headers
- **CORS** - Cross-origin configuration
- **Rate Limiting** - API & AI endpoint protection
- **Input Validation** - express-validator
- **Password Hashing** - bcrypt (12 rounds)
- **JWT Auth** - Stateless authentication
- **HPP Protection** - Parameter pollution prevention
- **SQL Injection Prevention** - Parameterized queries

## 🤖 AI Providers

Supports OpenAI and Anthropic with automatic fallback:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## 💳 Payments

Stripe integration for subscriptions:
- Free, Basic ($9.99), Pro ($19.99), Enterprise ($49.99)
- Webhook handling for payment events
- Subscription lifecycle management
