# 🚛 FleetOS — Multi-Role Fleet Management System

A production-ready Fleet Management and Authentication system built with **React.js + Node.js (MVC) + PostgreSQL (Prisma)**. Developed for **Odoo Hack 2k26**.

---

## 🌟 Key Features

### 👤 Role-Based Access Control (RBAC)
- **Separate Dashboards**: Dedicated UI experiences for **Admin, Manager, Dispatcher, and Driver**.
- **Role Security**: Middleware-enforced route protection using `allowedRoles`.
- **Session Management**: Secure JWT authentication stored in HTTP-only cookies.

### 🚗 Driver Module
- **Public Registration**: Comprehensive onboarding form for drivers.
- **Auto-IDs**: Automatic generation of unique IDs (`EMP-XXXX` for staff, `DRV-XXXX` for drivers).
- **Approval Workflow**: Integrated admin portal for reviewing and approving driver applications.
- **Identity Privacy**: Driver authentication uses a separate JWT secret from internal staff.

### 📎 Cloudinary Integration
- **Dynamic Uploads**: Secure handling of driver license documents (JPG, PNG, PDF).
- **Validation**: Server-side file type and size (<5MB) verification.

### 🗺️ Fleet & Trips
- **Relational Schema**: Prisma-powered connection between Drivers and Trips.
- **Real-time Status**: Tracking of driver availability (`AVAILABLE`, `ON_TRIP`, `INACTIVE`).

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Axios, Lucide Icons, Vanilla CSS (Premium Dark Theme).
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL.
- **Auth**: JWT (Separate for Staff/Drivers), Bcrypt.js.
- **Storage**: Cloudinary API (Document Storage).
- **Email**: Brevo API (Transactional Emails).

---

## 🚀 Local Setup

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Railway, Supabase, or Local)

### 2. Backend Configuration
1. Navigate to `backend` folder and create `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Fill in your environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `JWT_SECRET`: Random string for staff auth.
   - `DRIVER_JWT_SECRET`: Random string for driver auth.
   - `CLOUDINARY_URL`: From your Cloudinary Dashboard.

3. Install dependencies and push schema:
   ```bash
   npm install
   npx prisma db push
   ```

4. Start Backend:
   ```bash
   npm run dev
   ```

### 3. Frontend Configuration
1. Navigate to `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Start Frontend:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173).

---

## 📂 Project Structure

```text
├── backend/
│   ├── prisma/             # Database Schema
│   ├── config/             # DB & Cloudinary Configuration
│   ├── controllers/        # Business Logic (Auth, Admin, Driver)
│   ├── middleware/         # Auth & RBAC Guards
│   ├── models/             # Data Interaction Layer
│   └── routes/             # API Endpoints
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI & Route Guards
    │   ├── context/        # Global Auth State
    │   ├── pages/          # Dashboards & Auth views
    │   └── services/       # API Axios Instance
```

---

## 🤝 How to Contribute

To sync your work with the official repository:

### 1. Initialize & Connect
```bash
git init
git remote add origin https://github.com/chetan137/Odoo_2k26.git
```

### 2. Commit Progress
```bash
git add .
git commit -m "feat: implement multi-role RBAC and driver module"
```

### 3. Push to GitHub
```bash
git branch -M main
git push -u origin main
```

---
*Created for Odoo Hack 2k26 by Chetan & Team.*
