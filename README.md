# 🔐 Full-Stack Authentication System

A complete, production-ready authentication system built with **React.js + Node.js/Express + PostgreSQL (Supabase/Neon)**.

---

## 📁 Folder Structure

```
ODOO_HACK2/
├── backend/                        # Node.js + Express API (MVC)
│   ├── config/
│   │   ├── db.js                   # PostgreSQL pool connection
│   │   └── initDB.js               # Auto-create tables on startup
│   ├── controllers/
│   │   └── authController.js       # Signup, Login, Logout, Forgot/Reset Password
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verify (cookie + Bearer header)
│   │   └── validationMiddleware.js  # express-validator error handler
│   ├── models/
│   │   └── userModel.js            # All DB queries for users table
│   ├── routes/
│   │   └── authRoutes.js           # REST API routes
│   ├── utils/
│   │   ├── emailService.js         # Nodemailer reset-password email
│   │   ├── jwtHelper.js            # Generate / verify / set cookie
│   │   └── passwordValidator.js    # Password strength rules
│   ├── .env                        # ← Fill in your secrets here
│   ├── .env.example                # Template for .env
│   ├── server.js                   # Express app entry point
│   └── package.json
│
└── frontend/                       # React.js + Vite SPA
    ├── src/
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx  # Redirects unauthenticated → /login
    │   │   └── GuestRoute.jsx      # Redirects authenticated → /dashboard
    │   ├── context/
    │   │   └── AuthContext.jsx     # Global auth state + session check
    │   ├── pages/
    │   │   ├── LoginPage.jsx       # Email/password login
    │   │   ├── SignupPage.jsx      # Registration with live validation
    │   │   ├── ForgotPasswordPage.jsx
    │   │   ├── ResetPasswordPage.jsx
    │   │   └── DashboardPage.jsx   # Protected user dashboard
    │   ├── services/
    │   │   └── api.js              # Axios instance + all API calls
    │   ├── utils/
    │   │   └── validators.js       # Frontend password validation helpers
    │   ├── App.jsx                 # React Router v6 routing
    │   ├── main.jsx                # Entry point
    │   └── index.css               # Complete design system (dark theme)
    ├── index.html
    ├── vite.config.js              # Dev proxy → backend :5000
    └── package.json
```

---

## ⚡ REST API Reference

| Method | Endpoint                    | Auth     | Description                     |
|--------|-----------------------------|----------|---------------------------------|
| POST   | `/api/auth/signup`          | Public   | Register a new user             |
| POST   | `/api/auth/login`           | Public   | Login and receive JWT cookie    |
| POST   | `/api/auth/logout`          | 🔒 JWT   | Clear auth cookie               |
| GET    | `/api/auth/me`              | 🔒 JWT   | Get current user info           |
| POST   | `/api/auth/forgot-password` | Public   | Send password reset email       |
| POST   | `/api/auth/reset-password`  | Public   | Reset password via token        |
| GET    | `/api/health`               | Public   | Server health check             |

---

## 🚀 Quick Start

### 1 — Get a PostgreSQL Database

Choose **one** of these free options:

- **[Supabase](https://supabase.com)** → Create project → Settings → Database → copy **Connection String**
- **[Neon](https://neon.tech)** → Create project → copy **Connection String**

---

### 2 — Configure the Backend

```bash
cd backend
```

Edit **`.env`** and fill in your values:

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname   # From Supabase/Neon
JWT_SECRET=your_super_long_random_secret_here
RESET_TOKEN_EXPIRY_MINUTES=15
PORT=5000
FRONTEND_URL=http://localhost:5173

# Gmail SMTP (enable 2FA → App Passwords in Google Account)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=xxxx_xxxx_xxxx_xxxx       # 16-char App Password (NOT your real password)
EMAIL_FROM=Auth System <your_gmail@gmail.com>

COOKIE_SECRET=another_long_random_secret
```

> 💡 **Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords

---

### 3 — Run the Backend

```bash
cd backend
npm run dev          # starts on http://localhost:5000
```

The database table (`users`) is **auto-created** on first startup — no manual SQL required.

---

### 4 — Run the Frontend

```bash
cd frontend
npm run dev          # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🔒 Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | `bcryptjs` with 12 salt rounds |
| JWT storage | HTTP-only cookie (XSS-safe) |
| CORS | Restricted to `FRONTEND_URL` with `credentials: true` |
| Rate limiting | 20 req / 15 min per IP on all `/api/auth/*` routes |
| Helmet | Security HTTP headers |
| Reset token | SHA-256 hashed before DB storage, expires in 15 min |
| Input sanitization | `express-validator` on every route |
| Duplicate email | Checked before user creation (`409 Conflict`) |

---

## ✅ Validation Rules

### Sign Up
| Field | Rule |
|-------|------|
| Name | Required, 2–100 chars |
| Email | Valid format, unique in DB |
| Password | >8 chars, 1 uppercase, 1 lowercase, 1 special char |
| Confirm Password | Must exactly match Password |

### Login
| Scenario | Error Returned |
|----------|---------------|
| Email not found | `"Account does not exist."` |
| Wrong password | `"Invalid Password."` |

---

## 🗄️ Database Schema

```sql
CREATE TABLE IF NOT EXISTS users (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(100) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  password          VARCHAR(255) NOT NULL,         -- bcrypt hash
  is_verified       BOOLEAN DEFAULT FALSE,
  reset_token       VARCHAR(255),                  -- SHA-256 of the emailed token
  reset_token_expiry TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎨 Frontend Pages

| Route | Page | Access |
|-------|------|--------|
| `/login` | Sign In | Guest only |
| `/signup` | Create Account | Guest only |
| `/forgot-password` | Forgot Password | Guest only |
| `/reset-password?token=...` | Reset Password | Guest only |
| `/dashboard` | User Dashboard | 🔒 Authenticated |

---

## 🛠 Tech Stack

**Backend:** Node.js · Express · PostgreSQL (`pg`) · bcryptjs · jsonwebtoken · Nodemailer · express-validator · helmet · express-rate-limit · cookie-parser

**Frontend:** React 18 · Vite · React Router v6 · Axios · react-hot-toast · Inter font (Google Fonts)
