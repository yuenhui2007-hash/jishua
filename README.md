# ResumeAI Pro

AI-powered resume builder with 6 specialized AI design agents, full-stack backend, and production-ready security.

## 🌐 Live Demo

**https://yuenhui2007-hash.github.io/jishua/**

## ✨ Features

### Frontend
- **AI Template Studio** - 6 specialized AI agents generating unique resume templates
- **Interactive Resume Builder** - Real-time preview with form editing
- **ATS Optimization** - Keyword matching and score visualization
- **Responsive Design** - Dark theme with gold accents, mobile-ready

### Backend
- **REST API** - Express.js with full CRUD
- **Authentication** - JWT-based with password reset
- **AI Integration** - OpenAI + Anthropic with fallback
- **Database** - SQLite (production-ready, can swap to PostgreSQL)
- **Payments** - Stripe subscription handling
- **Email** - SMTP welcome and notification emails
- **Security** - Rate limiting, input validation, helmet, HPP protection

### AI Agents
| Agent | Specialty | Style |
|-------|-----------|-------|
| **Aurelius** | Executive Strategist | Boardroom authority |
| **Nova** | Creative Visionary | Bold & portfolio-forward |
| **Cipher** | Technical Architect | ATS-optimized, data viz |
| **Luna** | Minimalist Purist | Swiss-inspired elegance |
| **Phoenix** | Career Transformer | Pivot & narrative focus |
| **Atlas** | Academic Scholar | Formal CV, publications |

## 🏗️ Architecture

```
resumeai-pro/
├── frontend/                 # Static site (GitHub Pages)
│   ├── index.html            # Landing page
│   ├── app.html              # Resume builder
│   ├── ai-templates.html     # AI Template Studio
│   ├── pricing.html          # Pricing page
│   ├── css/
│   ├── js/
│   └── src/
│       ├── api/client.js     # API client
│       └── components/       # Reusable components
│
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── server.js         # Express entry
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, validation, rate limit
│   │   ├── models/           # Database schema
│   │   ├── services/         # AI, email, payments
│   │   └── utils/            # Logger
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Frontend (Static)
```bash
# Just open the HTML files or serve with any static server
npx serve .
```

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configure your API keys in .env
npm run dev
```

## 🔌 API Integration

The frontend includes a complete API client (`frontend/src/api/client.js`):

```javascript
// Auth
await API.register({ email, password, firstName, lastName });
await API.login({ email, password });

// Resumes
await API.createResume({ title, content, templateId });
await API.getResumes();

// AI
await API.generateWithAI('summary', { jobTitle, skills });
await API.optimizeATS(resumeContent, jobDescription);

// Payments
await API.createPaymentIntent('pro');
```

## 🔐 Environment Variables

```env
# Server
PORT=5000
FRONTEND_URL=http://localhost:3000

# Security
JWT_SECRET=your-secret-key

# AI
OPENAI_API_KEY=sk-...
AI_PROVIDER=openai

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| AI | OpenAI GPT-4o, Anthropic Claude |
| Payments | Stripe |
| Email | Nodemailer |
| Auth | JWT, bcrypt |

## 📝 License

MIT
