# 🚛 FleetOps — Multi-Role Fleet Management System

A production-ready **Fleet Management, Driver Management, and Authentication** platform built with **React.js + Node.js (Express/MVC) + PostgreSQL**. Developed for **Odoo Hack 2k26**.

---

## 🌟 Key Features

### 🔐 Authentication & Role-Based Access Control (RBAC)
- **JWT Auth** stored in HTTP-only cookies (separate secrets for Staff and Drivers)
- **4 Role Levels**: `ADMIN`, `MANAGER`, `DISPATCHER`, `USER`
- **Middleware Guards**: `adminOnly`, `managerOrAdmin`, `requireRole` protect every sensitive route
- **Password Security**: Bcrypt hashing + forget-password / reset-password email flow (via Brevo)
- **Rate Limiting**: Auth routes protected against brute-force attacks

### 👤 User Management (Admin)
- Create, view, and search all registered staff
- Update user **roles** and **account status** (active / suspended)
- Admin-triggered **password reset** emails
- Auto-generated Employee IDs (`EMP-XXXX`)

### 🚗 Driver Module
- **Public Registration**: Comprehensive onboarding form with license document upload
- **Approval Workflow**: Admins review, approve, or suspend driver accounts
- **Separate Auth Flow**: Drivers use a dedicated JWT secret and login endpoint
- **Auto-IDs**: Unique `DRV-XXXX` Driver IDs generated on registration
- **Cloudinary Integration**: Secure driver license document storage (JPG, PNG, PDF, <5MB)

### 🚛 Fleet Management (Admin + Manager)
- **Vehicle Registry**: Full CRUD for company vehicles with auto-generated `VHL-XXXX` IDs
- **Categories**: `BIKE`, `LIGHT`, `MEDIUM`, `HEAVY`, `EXTRA_HEAVY`, `CONTAINER`
- **Status Tracking**: `AVAILABLE`, `ON_TRIP`, `IN_SHOP` with inline updates
- **Cargo Dimensions (Fit Axis)**: Store `lengthFt`, `widthFt`, `heightFt` with auto-generated `dimensionLabel` (e.g. `5.5ft x 4.5ft x 5.0ft`)
- **Fleet Stats**: Live dashboard cards showing totals by status

### 📋 Vehicle History & Servicing Log
- **Complete Audit Trail**: Every modification automatically creates a history record
- **10 Event Types**: `CREATED`, `UPDATED`, `STATUS_CHANGE`, `SERVICE`, `OIL_CHANGE`, `TYRE_CHANGE`, `MAINTENANCE`, `TRIP_ASSIGNED`, `TRIP_COMPLETED`, `EXPENSE_ADDED`
- **Auto-Logging**: History entries created inside DB transactions — no change without a record
- **Service Records**: Log oil changes, tyre replacements, maintenance with cost, date, and technician name
- **Timeline UI**: Chronological, color-coded history timeline in a slide-in vehicle detail drawer

### 📊 Admin Dashboard
Tabbed dashboard with three sections:
| Tab | Description |
|---|---|
| 👥 Users | Manage all staff, roles, and account statuses |
| 🚗 Drivers | Review applications, approve/suspend drivers |
| 🚛 Fleet | Manage vehicles, dimensions, service logs, history |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Axios, Vanilla CSS (Dark Theme) |
| **Backend** | Node.js, Express.js (MVC), `pg` (raw SQL), Prisma ORM |
| **Database** | PostgreSQL (Railway cloud-hosted) |
| **Auth** | JWT (`jsonwebtoken`), Bcrypt.js, HTTP-only Cookies |
| **Validation** | `express-validator` |
| **Email** | Brevo Transactional API |
| **Storage** | Cloudinary API |
| **Security** | Helmet, CORS, express-rate-limit, cookie-parser |

---

## 🗄️ Database Architecture

### Tables

| Table | ORM / Driver | Purpose |
|---|---|---|
| `users` | Prisma | Staff accounts and authentication |
| `drivers` | Prisma | Driver profiles and approval status |
| `vehicles` | Raw SQL (`pg`) | Company vehicle registry |
| `vehicle_history` | Raw SQL (`pg`) | Full audit trail and servicing log |

### Key Enums (PostgreSQL)
- `Role`: `ADMIN`, `MANAGER`, `DISPATCHER`, `USER`
- `VehicleStatus`: `AVAILABLE`, `ON_TRIP`, `IN_SHOP`
- `VehicleCategory`: `BIKE`, `LIGHT`, `MEDIUM`, `HEAVY`, `EXTRA_HEAVY`, `CONTAINER`
- `VehicleEventType`: `CREATED`, `UPDATED`, `STATUS_CHANGE`, `SERVICE`, `OIL_CHANGE`, `TYRE_CHANGE`, `MAINTENANCE`, `TRIP_ASSIGNED`, `TRIP_COMPLETED`, `EXPENSE_ADDED`

---

## 🌐 API Reference

### Auth Routes — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register a new user |
| POST | `/login` | Login and receive JWT cookie |
| POST | `/logout` | Clear auth cookie |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password/:token` | Reset password with token |

### Admin Routes — `/api/admin` *(Protected)*
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/users` | Admin/Manager | List all users |
| POST | `/users` | Admin | Create a new user |
| PATCH | `/users/:id/role` | Admin | Update user role |
| PATCH | `/users/:id/status` | Admin | Activate / suspend user |
| PATCH | `/users/:id/reset-password` | Admin | Trigger password reset |
| GET | `/drivers` | Admin/Manager | List all drivers |
| PATCH | `/drivers/:id/approve` | Admin | Approve driver application |
| PATCH | `/drivers/:id/status` | Admin/Manager | Update driver status |
| GET | `/vehicles` | Admin/Manager | List all vehicles + stats |
| POST | `/vehicles` | Admin | Add a new vehicle |
| GET | `/vehicles/:id` | Admin/Manager | Get single vehicle detail |
| PATCH | `/vehicles/:id` | Admin | Update vehicle details/dimensions |
| PATCH | `/vehicles/:id/status` | Admin/Manager | Change vehicle status |
| POST | `/vehicles/:id/service` | Admin/Manager | Add service/maintenance record |
| GET | `/vehicles/:id/history` | Admin/Manager | Fetch full history timeline |

### Driver Routes — `/api/drivers`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Driver public registration with document upload |
| POST | `/login` | Driver-specific JWT login |

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL (or use Railway / Supabase for cloud hosting)

### 1. Clone the Repository
```bash
git clone https://github.com/chetan137/Odoo_2k26.git
cd Odoo_2k26
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file:
```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>
JWT_SECRET=your_jwt_secret_32chars_minimum
JWT_EXPIRES_IN=7d
DRIVER_JWT_SECRET=your_driver_jwt_secret_64chars
DRIVER_JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
COOKIE_SECRET=your_cookie_secret_32chars
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=you@example.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Push the Prisma schema:
```bash
npx prisma db push
```

Run the vehicle history migration (creates `vehicle_history` table + cargo dimension columns):
```bash
node scripts/migrateVehicleHistory.js
```

Start the server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📂 Project Structure

```text
FleetOps/
├── backend/
│   ├── config/                  # DB pool & Cloudinary setup
│   ├── controllers/
│   │   ├── authController.js    # Login, signup, password reset
│   │   ├── adminController.js   # User & driver management
│   │   ├── driverController.js  # Driver registration & login
│   │   └── vehicleController.js # Fleet CRUD + history logging
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification & RBAC guards
│   │   └── prismaErrorHandler.js
│   ├── prisma/
│   │   └── schema.prisma        # Prisma schema (users, drivers)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js       # All admin API routes
│   │   └── driverRoutes.js
│   ├── scripts/
│   │   ├── migrateVehicleHistory.js  # DB migration: vehicle_history + dims
│   │   └── seedVehicles.js           # Seed sample vehicles
│   └── server.js                # Express app entry point
└── frontend/
    ├── index.html               # App entry (title: FleetOps)
    └── src/
        ├── components/          # ProtectedRoute, Navbar, etc.
        ├── context/             # AuthContext (global user state)
        ├── pages/
        │   ├── AdminPage.jsx    # Admin dashboard (Users/Drivers/Fleet tabs)
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   └── DriverRegisterPage.jsx
        └── services/
            └── api.js           # Axios instance + all API functions
```

---

## 🔑 Environment Variables Summary

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Staff authentication token signing |
| `DRIVER_JWT_SECRET` | ✅ | Driver authentication token signing |
| `COOKIE_SECRET` | ✅ | Cookie signing secret |
| `BREVO_API_KEY` | ✅ | Transactional email service |
| `CLOUDINARY_*` | ✅ | Driver document file storage |
| `FRONTEND_URL` | ✅ | CORS allowed origin |
| `PORT` | ⚪ | Server port (default: 5000) |
| `NODE_ENV` | ⚪ | `development` or `production` |

---

## 🤝 Contributing

```bash
git add .
git commit -m "feat: your feature description"
git push origin main
```

---

*Built for **Odoo Hack 2k26** by Chetan & Team.*
