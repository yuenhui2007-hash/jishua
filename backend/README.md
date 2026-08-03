# Jishua Backend + Admin Panel

Complete backend API and admin dashboard for the Jishua AI Resume Builder.

## Features

- **REST API** — Auth, resumes, AI generation, Stripe payments
- **Admin Dashboard** — View users, orders, revenue analytics
- **JWT Authentication** — Separate tokens for users and admins
- **SQLite Database** — Zero-config, production-ready
- **Stripe Integration** — Subscriptions and webhooks
- **AI Integration** — OpenAI + Anthropic with fallback

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Seed admin user
npm run seed

# 4. Start server
npm run dev
```

Server runs at `http://localhost:5000`

Admin Panel: `http://localhost:5000/admin`

## Default Admin Login

- **Email:** `admin@jishua.ai` (or your ADMIN_EMAIL)
- **Password:** `admin123` (or your ADMIN_PASSWORD)

Change the password in production by hashing a new one:

```bash
node -e "console.log(require('bcryptjs').hashSync('newpassword', 10))"
```

Then set `ADMIN_PASSWORD_HASH` in `.env`.

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/admin/login` | Admin login |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resumes` | List user resumes |
| POST | `/api/resumes` | Create resume |
| GET | `/api/resumes/:id` | Get resume |
| PUT | `/api/resumes/:id` | Update resume |
| DELETE | `/api/resumes/:id` | Delete resume |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-checkout-session` | Stripe checkout |
| POST | `/api/payments/create-payment-intent` | One-time payment |
| GET | `/api/payments/history` | Payment history |
| POST | `/api/payments/webhook` | Stripe webhook |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate` | Generate content |
| POST | `/api/ai/optimize-ats` | ATS optimization |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | List users |
| GET | `/api/admin/users/:id` | User details |
| GET | `/api/admin/orders` | List orders |
| GET | `/api/admin/orders/:id` | Order details |
| GET | `/api/admin/analytics/revenue` | Revenue data |
| GET | `/api/admin/analytics/users` | User growth |
| GET | `/api/admin/analytics/ai` | AI usage |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `JWT_SECRET` | Yes | Secret for user tokens |
| `ADMIN_JWT_SECRET` | Yes | Secret for admin tokens |
| `OPENAI_API_KEY` | Yes* | OpenAI API key |
| `ANTHROPIC_API_KEY` | No | Anthropic API key (fallback) |
| `STRIPE_SECRET_KEY` | Yes* | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes* | Stripe webhook secret |
| `STRIPE_PRICE_ID_PRO` | Yes* | Stripe price ID for Pro tier |
| `STRIPE_PRICE_ID_ENTERPRISE` | Yes* | Stripe price ID for Enterprise tier |
| `ADMIN_EMAIL` | No | Default admin email |
| `ADMIN_PASSWORD` | No | Default admin password (seed only) |

*Required for respective features to work.

## Deployment

### Using Render/Railway

1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Add build command: `npm install && npm run seed`
5. Start command: `npm start`

### Stripe Webhook Setup

For local development, use Stripe CLI:

```bash
stripe login
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

### Frontend Integration

Update your frontend API client to point to this backend:

```javascript
const API_BASE = 'http://localhost:5000/api';
```

## Database

SQLite database stored at `./data/jishua.db`. To migrate to PostgreSQL:

1. Install `pg` and update `database.js`
2. Replace `better-sqlite3` queries with PostgreSQL syntax
3. The schema remains identical

## Security

- Helmet headers
- Rate limiting on auth endpoints
- JWT with expiration
- Admin session tracking
- Input validation on all routes
- Stripe webhook signature verification

## License

MIT
