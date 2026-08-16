# QuickCommerce — Architecture & Design Plan

## 1. Overall architecture

```text
React 18 (Vite, JavaScript, MUI, Redux Toolkit)
        |
        |  REST + JWT (Axios, Bearer access token, silent refresh)
        v
Django 4.2 + Django REST Framework
        |                     \
        |  Django ORM          \  publish(domain_event)
        v                       v
     SQLite                 Redis Streams  --> event worker --> Notifications
                                                                (Email now,
                                                                 push/WhatsApp/SMS later)
        |
        v
  ./backend/media  (product / shop / KYC uploads)
```

Domain-oriented Django apps — each owns its models, serializers, permissions and services:

| App | Bounded context |
| --- | --- |
| `common` | Shared base model, permissions, pagination, geo helpers, error envelope |
| `accounts` | User identity, roles, JWT auth, profiles |
| `locations` | Customer addresses, lat/lng, distance queries |
| `catalog` | Product categories (platform-wide taxonomy) |
| `shops` | Shop onboarding, KYC, approval lifecycle, discovery |
| `products` | Shop-owned products, pricing, stock |
| `carts` | Single-shop cart and cart items |
| `orders` | Order aggregate, order items, status state machine |
| `payments` | Payment records + pluggable gateway strategies (Razorpay, COD) |
| `delivery` | Delivery partner profile, availability, delivery lifecycle |
| `notifications` | Notification records + pluggable channel strategies (Email now) |
| `events` | Domain event contract, Redis-backed bus, handler registry, worker |
| `dashboard` | Read-only aggregate stats per role |

## 2. Database model plan

```text
User(id, name, email(unique, login), phone, role, is_active, is_approved, created_at)
  role ∈ {CUSTOMER, SHOPKEEPER, DELIVERY_PARTNER, ADMIN}

Address(user→User, label, name, phone, address_line, landmark, city, state,
        pincode, latitude, longitude, is_default)

Category(name, slug, image, is_active, sort_order)

Shop(owner→User, name, slug, description, category→Category, phone, address,
     city, state, pincode, latitude, longitude, opening_time, closing_time,
     status ∈ {PENDING,APPROVED,REJECTED,SUSPENDED}, rejection_reason, image,
     delivery_fee, min_order_value, avg_prep_minutes, rating, rating_count,
     is_accepting_orders, cod_enabled)
ShopKyc(shop→Shop 1-1, business_name, license_type, license_number, gst_number,
        pan_number, bank_account_name/number/ifsc, license_document, extra(JSON))

Product(shop→Shop, category→Category, name, description, price, discount_price,
        unit, stock_quantity, image, is_available, created_at, updated_at)

Cart(customer→User 1-1, shop→Shop nullable)
CartItem(cart→Cart, product→Product, quantity)   unique(cart, product)

Order(order_number, customer→User, shop→Shop, delivery_partner→User nullable,
      address snapshot fields, subtotal, delivery_fee, discount, tax,
      total_amount, status, payment_status, payment_method, cancel_reason)
OrderItem(order→Order, product→Product nullable, product_name, unit,
          quantity, unit_price, total_price)          # price snapshot
OrderStatusEvent(order→Order, from_status, to_status, changed_by, note)

Payment(order→Order, gateway, method, gateway_order_id, gateway_payment_id,
        signature, amount, status, error_code, error_description, raw_response)

DeliveryPartnerProfile(user→User 1-1, vehicle_type, vehicle_number,
        licence_number, is_online, is_approved, current_lat, current_lng)
Delivery(order→Order 1-1, partner→User, status, pickup_time, delivery_time)

Notification(user→User, channel, event_type, subject, body, status,
        error, sent_at, payload(JSON))
```

Snapshots (`OrderItem.product_name/unit_price`, `Order.address_*`) keep history correct
when products or addresses change later.

## 3. API endpoint plan

```text
/api/auth/        register/ (customer|shopkeeper|delivery) login/ token/refresh/ me/ change-password/
/api/addresses/   CRUD + set-default
/api/categories/  list (public), admin CRUD
/api/shops/       nearby/ (public, lat+lng), :slug/ detail, my-shop/ (shopkeeper), :id/products/
/api/products/    list/filter (public by shop), shopkeeper CRUD (own shop only)
/api/cart/        GET, items/ POST, items/:id/ PATCH DELETE, clear/
/api/orders/      POST create, GET list (role-scoped), :id/, :id/transition/, :id/cancel/
/api/payments/    methods/, initiate/, verify/, :order/status/, webhook/
/api/delivery/    profile/, availability/, available-orders/, my-deliveries/, :id/transition/
/api/admin/       stats/ users/ shops/ shops/:id/approve|reject|suspend/ orders/
                  orders/:id/assign-partner/ delivery-partners/ payments/ products/
/api/dashboard/   shopkeeper/ delivery/ customer/  (role aggregate stats)
```

## 4. Frontend page / component plan

```text
layouts/   PublicLayout, CustomerLayout, DashboardLayout (sidebar per role)
routes/    AppRoutes, ProtectedRoute(roles=[...]), RoleRedirect
store/     auth, cart, shops, products, orders, delivery, admin, ui slices (RTK)
services/  api.js (axios + JWT interceptors + refresh queue), one module per domain
pages/customer/    Home, Shops, ShopDetail, Cart, Checkout, Orders, OrderDetail, Profile, Addresses
pages/shopkeeper/  Dashboard, Orders, Products, ProductForm, ShopProfile, Earnings
pages/delivery/    Dashboard, Available, Active, History, Profile
pages/admin/       Dashboard, Users, Shops, ShopDetail, Orders, Products, Partners, Payments, Categories
components/        ShopCard, ProductCard, QuantityStepper, MapPicker, OrderTimeline,
                   StatusChip, DataStates(Loading/Empty/Error), ConfirmDialog, ImageUpload
```

## 5. Role / permission matrix

| Capability | Customer | Shopkeeper | Delivery | Admin |
| --- | :-: | :-: | :-: | :-: |
| Browse approved shops / products | ✅ | ✅ | ✅ | ✅ |
| Manage own addresses | ✅ | — | — | — |
| Cart + place order | ✅ | — | — | — |
| View own orders | ✅ | own shop | assigned only | all |
| Create/manage products | — | own shop only | — | any shop |
| Order transitions PLACED→READY_FOR_PICKUP | — | own shop | — | ✅ |
| Delivery transitions PICKED_UP→DELIVERED | — | — | assigned only | ✅ |
| Approve shops / partners, assign delivery | — | — | — | ✅ |
| Payments: initiate/verify own order | ✅ | — | — | ✅ (read) |

Enforced server-side by DRF permission classes + queryset scoping; the frontend only
mirrors it for UX.

## 6. Patterns used (kept deliberately light)

- **Strategy + registry** — `payments/gateways` (`RazorpayGateway`, `CashOnDeliveryGateway`)
  and `notifications/channels` (`EmailChannel`, stubs for `push`/`whatsapp`/`sms`).
  Both are resolved from settings, so adding Stripe or FCM is a new class + a settings entry.
- **State machine** — `orders/state_machine.py` holds the only allowed transitions and
  which role may perform each one.
- **Service layer** — `orders/services.py`, `payments/services.py`, `carts/services.py`
  keep business rules out of views/serializers.
- **Observer / pub-sub** — `events/bus.py` publishes domain events to Redis Streams;
  `events/handlers.py` subscribers fan out to notifications. Falls back to synchronous
  dispatch when Redis is unavailable so local dev never breaks.
