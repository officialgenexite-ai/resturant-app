# 🍔 Restaurant Ordering App

**A production-deployed food ordering system for local restaurants: Android customer app + secure web admin dashboard + serverless API.**

Built for a restaurant in Multan, Pakistan, with local payment methods (Cash on Delivery and JazzCash) and a workflow designed around how small restaurants actually operate.

---

## The Problem

Most local restaurants still take orders over phone calls and WhatsApp. That means:

- Missed or mis-heard orders during rush hours
- No proper record of who ordered what, or who has paid
- Customers calling repeatedly to ask "where is my order?"
- Payment screenshots buried in chat threads, hard to verify
- Expensive delivery platforms that take a large commission on every order

## The Solution

A branded, restaurant-owned ordering app where customers browse the menu, place orders, and track them end to end, while the owner manages everything from one browser dashboard that alerts them the moment a new order arrives.

- **Customers** get a fast, familiar ordering experience (menu, cart, checkout, order tracking)
- **Owners** get a live dashboard with sound and browser notifications, one-click approve/reject, and a full order pipeline
- **No commission fees**: the restaurant owns the app, the data, and the customer relationship

---

## Core Features

### Customer App (React Native / Android)
- Sign up with email (6-digit verification code, resend supported) or **Google Sign-In**
- Menu with dynamic categories, search, and product detail pages
- **Size/variant options** per product with live price updates
- Persistent cart that survives app restarts
- Menu cached for 15 minutes and usable offline, with pull-to-refresh
- Checkout with **local delivery areas** (Multan sectors), landmark, and phone number
- **Cash on Delivery** or **manual JazzCash transfer** (Transaction ID + payment screenshot)
- Order history with live status (Pending → Preparing → Out for Delivery → Delivered) and estimated delivery time

### Admin Dashboard (Web)
- Live order queue that polls every 12 seconds, with a **bell sound and browser notification** for new orders
- JazzCash orders: view screenshot, TID, and customer details, then **Approve / Reject** in one click
- COD orders: one-click **Accept**
- Active orders board to move orders through *Out for Delivery* and *Delivered*
- Enforced status flow: orders cannot skip steps (for example Pending straight to Delivered)

### Security
- JWT authentication with bcrypt-hashed passwords
- Role-based access (customer / admin) enforced on the server for every protected endpoint
- **Two-layer admin protection:** a Basic Auth gate in front of the whole `/admin` area, plus a real admin login that rejects non-admin accounts
- **Server-side price recalculation:** the client never decides what an order costs
- Zod validation on every request body

---

## How It Works

```
 ┌──────────────────────┐        HTTPS / JSON         ┌─────────────────────────────┐
 │  React Native (Expo) │ ──────────────────────────▶ │  Next.js API (App Router)   │
 │  Customer app        │ ◀────────────────────────── │  Routes → Controllers →     │
 └──────────────────────┘                             │  Services → Models (MVC)    │
                                                      └──────┬──────────┬───────────┘
 ┌──────────────────────┐   same project, /admin              │          │
 │  Web Admin Dashboard │ ────────────────────────────────────┘          │
 │  (polling + alerts)  │                                                ▼
 └──────────────────────┘                          MongoDB Atlas · Cloudinary · Gmail SMTP
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native, Expo, TypeScript, React Navigation, Axios, AsyncStorage |
| Backend | Next.js (App Router), TypeScript, strict MVC structure |
| Database | MongoDB Atlas with Mongoose (serverless connection caching) |
| Auth | JWT, bcryptjs, Google Sign-In (native SDK, server-side token verification) |
| Validation | Zod |
| Email | Nodemailer (verification, welcome, and order confirmation emails) |
| Media | Cloudinary (product images, payment screenshots) |
| Hosting | Vercel (API + admin dashboard), EAS Build (Android APK) |

---

## Project Structure

```
restaurant-backend/
├── src/
│   ├── app/
│   │   ├── api/            # Thin route handlers (auth, categories, products, orders, admin)
│   │   └── admin/          # Web dashboard pages (login, orders)
│   ├── controller/         # Business logic
│   ├── model/              # Mongoose schemas (User, Category, Product, Order)
│   ├── services/           # Email and other integrations
│   ├── middlewares/        # JWT + role guards
│   ├── lib/                # DB connection, Cloudinary
│   └── middleware.ts       # CORS for /api, Basic Auth gate for /admin
└── scripts/seed.ts         # Seeds sample categories and products

frontend/
├── App.tsx
├── eas.json                # Build profiles + build-time env vars
└── mobile/src/
    ├── api/  components/  constants/  context/
    ├── navigation/  screens/  types/  utils/
```

---

## API Overview

| Area | Endpoints | Access |
|---|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/verify-email`, `/resend-verification`, `/google` | Public |
| Menu | `GET /api/categories`, `GET /api/products?category=slug`, `GET /api/products/:id` | Public |
| Menu management | `POST/PUT/DELETE /api/categories`, `/api/products` | Admin |
| Orders | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id` | Customer (own orders) |
| Order control | `PATCH /api/orders/:id/verify-payment`, `/accept`, `/status` | Admin |
| Dashboard feeds | `GET /api/admin/orders/pending`, `/active` | Admin |

---

## Environment Setup

> Never commit `.env` files. Vercel and EAS do **not** read your local `.env`; every variable must also be set in their dashboards/config.

### Backend (`restaurant-backend/.env.local`)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string (generate with `crypto.randomBytes(64)`) |
| `JWT_EXPIRES_IN` | Optional, defaults to `30d` |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | SMTP (use a Gmail **App Password**) |
| `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image storage |
| `GATE_USERNAME`, `GATE_PASSWORD` | Basic Auth gate for `/admin` |

### Mobile (`frontend/.env` and `eas.json` → `build.production.env`)

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL, ending in `/api` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Web client ID (required for Google Sign-In) |

The restaurant's JazzCash number and title are set in `frontend/mobile/src/constants/config.ts`.

---

## Local Development

```bash
# Backend
cd restaurant-backend
npm install
npm run dev            # http://localhost:3000
npm run seed           # optional: sample categories and products

# Mobile (needs a dev build because of native Google Sign-In; Expo Go won't work)
cd frontend
npm install
npx expo start --dev-client -c
```

To create an admin, register a normal account, then set `role: "admin"` on that user in MongoDB Atlas.

---

## Deployment

**Backend + Admin Dashboard (Vercel)**
1. Push the repo to GitHub and import `restaurant-backend` in Vercel
2. Add all backend environment variables in *Project Settings → Environment Variables*
3. **Redeploy** (new variables only apply to a new deployment)
4. Admin dashboard is live at `https://<your-domain>/admin/login`

**Android APK (EAS Build)**
1. Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `eas.json` under `build.production.env`
2. Register the production build's **SHA-1** (`npx eas-cli credentials`) in the Google Cloud Android OAuth client
3. Build a directly installable APK:
   ```bash
   npx eas-cli build --profile production --platform android
   ```
4. Share the download link; users enable "install from unknown sources" once

---

## Maintenance Guide

| Task | What to do |
|---|---|
| Update menu, prices, categories | Use the admin endpoints or re-run the seed script; images live on Cloudinary |
| Change delivery fee or areas | Update both the backend (order controller / areas constant) and `config.ts` in the app, then rebuild the APK |
| Change JazzCash number | Edit `config.ts` and ship a new APK |
| Backend-only change | `git push`, Vercel redeploys automatically. **No APK rebuild needed** |
| App UI/config change | New APK build required |
| New or changed env variable | Update it in Vercel, then redeploy |
| Google Sign-In breaks after a new build | The keystore changed: register the new SHA-1 in Google Cloud |
| Monitoring | Vercel Runtime Logs and MongoDB Atlas metrics |
| Email volume | Gmail SMTP allows roughly 500 emails/day; move to a transactional provider if volume grows |
| Security hygiene | Rotate secrets periodically (rotating `JWT_SECRET` logs everyone out), run `npm audit`, keep Atlas backups on |

---

## Roadmap

- Automated payment-screenshot verification using a serverless-friendly OCR service
- Push notifications for order status changes
- Customer-side order cancellation
- Menu management screens inside the admin dashboard
- Official JazzCash merchant gateway integration
- Delivery-rider assignment and live tracking

---

## Work With Me

I build production-ready mobile apps, admin dashboards, and backends for small businesses: ordering systems, booking apps, and custom management tools.

**Aftab: Freelance Full-Stack (MERN) Developer**
📱 WhatsApp: [+92 328 7635726](https://wa.me/923287635726)

Have a restaurant, shop, or service business that needs its own app? Message me and let's talk about what you need.
