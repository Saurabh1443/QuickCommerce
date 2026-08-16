# QuickCommerce

A production-style **local marketplace / quick-commerce MVP**: local shops register and
list products, customers discover nearby shops and order online, delivery partners
fulfil deliveries, and admins run the whole platform.

This is an original marketplace concept and UI — it is **not** a clone of any existing
app's branding, design, or copy.

---

## 1. Project overview

Four roles share one platform:

- **Customer** — discovers shops near a chosen location, browses products, orders and
  pays online or via Cash on Delivery, tracks delivery.
- **Shopkeeper** — registers a shop (pending admin approval), manages products/stock,
  and processes incoming orders through to "ready for pickup".
- **Delivery partner** — registers (pending admin approval), goes online/offline, and
  fulfils deliveries assigned by an admin, from pickup through to delivered.
- **Admin** — approves shops and delivery partners, moderates users, manages the
  category taxonomy, assigns deliveries, and can view every order/payment on the
  platform.

The backend is the single source of truth for authorization, pricing, stock and order
state — the frontend never decides any of this on its own.

## 2. Technology stack

**Frontend:** React 18 (Vite, plain JavaScript, no TypeScript), Material UI, React
Router, Redux Toolkit, Axios, `@react-google-maps/api`.

**Backend:** Python, Django 4.2, Django REST Framework, `djangorestframework-simplejwt`
(JWT auth), SQLite, Django ORM, `django-filter`, Redis (`redis-py`) for the event bus,
`razorpay` SDK.

**Cross-cutting design patterns:**

- **Strategy pattern** for payments (`apps/payments/gateways`: `RazorpayGateway`,
  `CashOnDeliveryGateway`) and notifications (`apps/notifications/channels`:
  `EmailChannel` today, `PushChannel` / `WhatsAppChannel` / `SmsChannel` stubs) — new
  providers are a new class plus one settings entry.
- **State machine** for order status transitions (`apps/orders/state_machine.py`) — the
  only place valid `(from, to, role)` edges are defined.
- **Observer / pub-sub** via a small Redis Streams event bus (`apps/events`) with a
  synchronous fallback, so notifications never block the request that triggered them
  and Redis is optional for local development.
- **Domain-oriented apps** — `accounts`, `locations`, `catalog`, `shops`, `products`,
  `carts`, `orders`, `payments`, `delivery`, `notifications`, `dashboard`, each owning
  its own models/serializers/services/permissions.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full architecture, database
model plan, API endpoint plan, and role/permission matrix produced before implementation.

## 3. Folder structure

```text
QuickCommerce/
  backend/
    manage.py
    config/                  # settings, urls, wsgi/asgi
    apps/
      common/                 # base model, permissions, pagination, geo helpers, seed_data command
      events/                 # domain event bus (Redis Streams) + subscriber registry
      accounts/                # custom User, roles, JWT serializers/views
      locations/               # customer addresses
      catalog/                 # platform-wide categories
      shops/                   # shop onboarding, KYC, approval workflow, discovery
      products/                # shop-owned products, stock, images
      carts/                   # single-shop cart + server-side pricing
      orders/                  # order aggregate, state machine, checkout
      payments/                # Payment model + gateway strategies (Razorpay/COD)
      delivery/                # delivery partner profile + delivery lifecycle
      notifications/           # Notification model + channel strategies
      dashboard/               # role-scoped aggregate stats + admin user management
    media/                     # uploaded shop/product/category images (gitignored)
    requirements.txt
    .env.example
  frontend/
    src/
      components/              # ShopCard, ProductCard, MapPicker, DataStates, ...
      layouts/                 # PublicLayout, CustomerLayout, DashboardLayout
      pages/
        auth/  customer/  shopkeeper/  delivery/  admin/
      routes/                  # ProtectedRoute
      services/                # one Axios module per backend domain
      store/                   # Redux Toolkit store (auth, cart, ui slices)
      utils/                   # constants, formatting, Razorpay loader
      App.jsx  main.jsx  theme.js
    .env.example
  docs/
    ARCHITECTURE.md            # architecture/DB/API/permission plan written pre-code
```

## 4. Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then fill in real values, see section 6

python manage.py migrate
python manage.py seed_data         # optional but recommended, see section 8
python manage.py createsuperuser   # optional, seed_data already creates an admin

python manage.py runserver 8000
```

The API is served at `http://127.0.0.1:8000/api/`. Uploaded images are served from
`http://127.0.0.1:8000/media/...` and stored under `backend/media/`.

Optional: run the async event worker (only needed if `EVENT_BUS_BACKEND=redis`, i.e.
you're running Redis and want notifications delivered off the request path):

```bash
redis-server &                      # if not already running
python manage.py run_event_worker
```

If Redis isn't running, leave `EVENT_BUS_BACKEND=redis` (default) — the bus
automatically falls back to synchronous, in-process dispatch when it can't reach
Redis, so nothing breaks; or explicitly set `EVENT_BUS_BACKEND=sync` to skip Redis
entirely.

## 5. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env                # then fill in real values, see section 6
npm run dev
```

The app runs at `http://localhost:5173` and expects the backend at
`VITE_API_BASE_URL` (default `http://127.0.0.1:8000/api`).

## 6. Environment variables

### Backend (`backend/.env`, copy from `backend/.env.example`)

| Variable | Purpose |
| --- | --- |
| `SECRET_KEY` | Django secret key — set a long random value. |
| `DEBUG` | `True` for local dev, `False` in production. |
| `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` | Hosts allowed to call the API / browser origins allowed by CORS. |
| `JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS` | Token lifetimes. |
| `GOOGLE_MAPS_API_KEY` | Server-side Google Maps key (optional; used only if you add server-side geocoding later). |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Razorpay credentials — see section 9. |
| `PAYMENTS_ALLOW_SANDBOX` | When Razorpay keys are blank, allows the app to run a local sandbox payment flow instead of failing. Turn off before production. |
| `EMAIL_BACKEND`, `EMAIL_HOST*`, `DEFAULT_FROM_EMAIL` | Email notification channel — see section 10. |
| `NOTIFICATION_ENABLED_CHANNELS` | Comma-separated list of enabled notification channels, e.g. `EMAIL`. |
| `REDIS_URL`, `EVENT_BUS_BACKEND` | Event bus backend (`redis`, `sync`, or `dummy`). |
| `SHOP_DISCOVERY_RADIUS_KM`, `DEFAULT_DELIVERY_FEE` | Business defaults. |

### Frontend (`frontend/.env`, copy from `frontend/.env.example`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the Django API. |
| `VITE_GOOGLE_MAPS_API_KEY` | Browser-side Google Maps key for the location picker. Optional — without it, the app falls back to a manual latitude/longitude entry. |
| `VITE_RAZORPAY_KEY_ID` | Razorpay publishable Key ID (safe to expose to the browser). |

**What you personally need to add before going beyond local sandbox testing** is
summarized again at the end of this README (section 15).

## 7. Database migrations

```bash
cd backend
python manage.py makemigrations   # only if you change models
python manage.py migrate
```

Note: this project's Django version occasionally reports "No changes detected" when
`makemigrations` is run with no app name right after adding several new apps in one
pass. If that happens, run it once per app (`python manage.py makemigrations accounts`,
etc.) and it will pick up every app correctly; subsequent plain `makemigrations` runs
work as expected.

## 8. Seed data

```bash
cd backend
python manage.py seed_data
```

## 9. Running everything

Three processes for full functionality (Redis is optional — see section 4):

```bash
# Terminal 1
redis-server

# Terminal 2
cd backend && source .venv/bin/activate && python manage.py runserver 8000
# optional: python manage.py run_event_worker   (in another terminal)

# Terminal 3
cd frontend && npm run dev
```

Then open `http://localhost:5173`.

