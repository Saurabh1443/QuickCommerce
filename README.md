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

Creates (all idempotent — safe to re-run):

- 1 admin, 5 customers, 5 shopkeepers (each with an **approved** shop), 3 delivery
  partners (2 approved & online, 1 pending approval)
- 10 categories, 5 shops, 35+ products

All data is fictitious. Development credentials (also printed by the command):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@quickcommerce.test` | `Admin@12345` |
| Customer | `aditi.customer@example.test` | `Password@123` |
| Shopkeeper | `ramesh.shop@example.test` | `Password@123` |
| Delivery partner | `suresh.delivery@example.test` | `Password@123` |

(Other seeded customer/shopkeeper/delivery accounts follow the same `Password@123`.)

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

## 10. API overview

All endpoints are under `/api/`. Responses use a consistent envelope on error:
`{"success": false, "error": {"code", "message", "fields"}}`. Lists are paginated with
`{count, page, page_size, total_pages, next, previous, results}`.

```text
/api/auth/               register/ login/ token/refresh/ me/ change-password/
/api/addresses/          CRUD (own addresses) + :id/set-default/
/api/categories/         public read, admin write
/api/shops/              register/ (shopkeeper onboarding) nearby/ :slug/
                         my-shop/ (shopkeeper) admin/ (moderation: approve/reject/suspend)
/api/products/           public list, manage/ (shopkeeper/admin CRUD + stock/toggle)
/api/cart/               GET/DELETE, items/ POST, items/:id/ PATCH/DELETE
/api/orders/             list/detail (role-scoped), POST (checkout), :id/transition/, :id/cancel/
/api/payments/           methods/ initiate/ verify/ orders/:id/status/ admin/ webhook/razorpay/
/api/delivery/           register/ profile/ availability/ available-orders/ my-deliveries/
                         :id/ :id/transition/ admin/partners/ admin/orders/:id/assign/ admin/active/
/api/notifications/      own history, admin/ (all)
/api/dashboard/          shopkeeper/ delivery/ admin/
/api/admin/              users/ users/:id/:action/ (activate|deactivate)
```

## 11. Authentication flow

1. Customer self-registers via `/api/auth/register/`, or logs in via `/api/auth/login/`
   — both return `{access, refresh, user}`.
2. Shopkeepers and delivery partners register via `/api/shops/register/` and
   `/api/delivery/register/`, which create the account **and** a `PENDING`/unapproved
   record; there are no tokens issued because they must wait for admin approval, then
   log in normally afterwards.
3. The frontend stores tokens in `localStorage` and attaches
   `Authorization: Bearer <access>` to every request (`frontend/src/services/api.js`).
4. On a `401`, the Axios interceptor calls `/api/auth/token/refresh/` once (de-duped
   across concurrent requests) and retries; if the refresh token itself is invalid, the
   app logs out.
5. **The role in the JWT/user record is the only role the backend trusts.** Every
   sensitive endpoint re-checks the role and object ownership server-side — the
   frontend's route guards and hidden buttons are UX only.

## 12. Razorpay test setup

1. Create a free Razorpay account and switch to **Test Mode**.
2. Copy the **Key ID** and **Key Secret** from Settings → API Keys.
3. Set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in `backend/.env`, and
   `VITE_RAZORPAY_KEY_ID` (Key ID only) in `frontend/.env`.
4. (Optional) set up a webhook pointing at `/api/payments/webhook/razorpay/` and put its
   signing secret in `RAZORPAY_WEBHOOK_SECRET` — this is a safety net; the primary
   verification path is the synchronous `/api/payments/verify/` call made right after
   checkout.
5. **Without any keys configured**, the backend automatically runs in a clearly-logged
   **local sandbox mode**: it fabricates a `sandbox_order_...` id and the checkout page
   auto-verifies against it, so the entire order → pay → order-confirmed flow is
   testable with zero external setup. Set `PAYMENTS_ALLOW_SANDBOX=False` to disable this
   before production.
6. Razorpay's own [test card/UPI numbers](https://razorpay.com/docs/payments/payments/test-card-upi-details/)
   work once real test keys are configured.

## 13. Google Maps setup

1. In Google Cloud Console, enable **Maps JavaScript API** (and **Places API** if you
   want autocomplete later) for a project.
2. Create a browser API key, restrict it by HTTP referrer (`localhost:5173` for dev),
   and put it in `frontend/.env` as `VITE_GOOGLE_MAPS_API_KEY`.
3. **Without a key**, `MapPicker` automatically falls back to a manual
   latitude/longitude form plus a "use current location" button, so address entry,
   shop onboarding and checkout all keep working.
4. Pricing/usage terms for the Google Maps Platform can change — check current
   quotas/billing before relying on it in production.

## 14. Known limitations

- Distance search uses a Python haversine calculation with a SQL bounding-box
  pre-filter, not PostGIS — fine at MVP scale, not for large catalogs.
- Delivery assignment is manual (an admin action), as scoped for the MVP.
- No OTP/SMS auth, no live GPS tracking / WebSockets, no coupons/refunds/ratings yet —
  see section 16 for what the code is already structured to support next.
- SQLite is single-writer; fine for local/dev, swap for PostgreSQL before production.
- The Razorpay webhook handler exists but isn't required for the primary flow to work;
  it's a best-effort safety net.

## 15. Future extensibility

Deliberately not built now, but the architecture leaves room for:

- Stripe (or another gateway) — add a class in `apps/payments/gateways/` implementing
  `PaymentGateway`, and one line in `settings.PAYMENT_GATEWAYS`.
- Push / WhatsApp / SMS notifications — implement `send()` in the existing stub classes
  under `apps/notifications/channels/` and add them to `NOTIFICATION_ENABLED_CHANNELS`.
- Celery for scheduled/retryable background jobs alongside the existing Redis event bus.
- WebSockets for live order tracking (Django Channels sits naturally next to the
  existing `asgi.py`).
- PostgreSQL + PostGIS for proper geospatial shop search.
- Automatic delivery-partner assignment, coupons, ratings/reviews, shop analytics,
  seller settlements, refund management, multi-shop carts, and cloud deployment.

## 16. What you need to configure before wider use

Everything below already has a safe local-dev default, so the app runs out of the box.
Fill these in when you're ready to test against real integrations:

1. **Google Maps** — `GOOGLE_MAPS_API_KEY` (backend, optional) and
   `VITE_GOOGLE_MAPS_API_KEY` (frontend) from Google Cloud Console (Maps JavaScript API
   enabled, key restricted by HTTP referrer). Their pricing/usage limits can change —
   check current terms before depending on it in production.
2. **Razorpay** — `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`
   (backend) and `VITE_RAZORPAY_KEY_ID` (frontend), from your Razorpay dashboard in Test
   Mode. Leave blank to keep using the built-in local sandbox flow.
3. **Email** — set `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`,
   `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
   and `DEFAULT_FROM_EMAIL` to send real emails (e.g. a Gmail account with an "App
   Password", or any SMTP provider). Left at the default, emails just print to the
   backend console — nothing breaks, you just won't receive real email.
4. **Redis** (optional) — install/run `redis-server` and keep `EVENT_BUS_BACKEND=redis`
   to get asynchronous notification delivery via `python manage.py run_event_worker`;
   otherwise it transparently falls back to synchronous dispatch.
5. **`SECRET_KEY`** — set a real random value before deploying anywhere shared.
