# ShopMate: Build Spec for Claude Code

This is the brief for building the real ShopMate store. The clickable prototype (`shopmate-prototype.html`, in this same folder) shows every page and interaction. Open it in a browser next to this spec. When the spec and the prototype disagree, the spec wins.

---

## 1. Tech stack (and why not React Native for the website)

**Goal:** an SEO-friendly, very fast, secure ecommerce website for India, with Razorpay payments.

React Native is for phone apps. Its web output (React Native Web / Expo web) renders in the browser, which hurts Google indexing and first-load speed. Use **Next.js**, which renders pages on the server so Google and customers get finished HTML right away. If you want a phone app later, build it with React Native (Expo) on top of the **same backend and API** described below.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Server rendering and static generation for SEO; fast first load |
| Styling | **Tailwind CSS**, using the ShopMate tokens (section 3) | Small CSS, consistent design |
| Database | **PostgreSQL** (Neon or Supabase) with **Prisma** ORM | Reliable for orders and money |
| Auth | **Phone OTP** with a session in an httpOnly cookie (Auth.js, or a small custom setup). SMS provider: MSG91, Twilio or Firebase Auth | Matches the prototype's login |
| Payments | **Razorpay Standard Checkout** + server-side signature verification + webhooks | UPI, cards, net banking, wallets; Razorpay handles PCI compliance |
| Images | `next/image`, stored on Cloudinary or S3 + CDN | Automatic resizing, WebP/AVIF, lazy loading |
| Search | Postgres full-text search to start; Meilisearch or Algolia later | Simple first, scalable later |
| Hosting | **Vercel** (or AWS/Render), with a Mumbai-region database | Low latency for Indian customers |
| Email/SMS | Resend or SES for receipts; MSG91 for OTP and order SMS | |
| Validation | **Zod** on every API input | Security |
| Analytics | GA4 or Plausible, plus Vercel Speed Insights | Track Core Web Vitals |

---

## 2. Pages and routes

The prototype uses `#hash` links because it's a single file. The real site must use **clean URLs**:

| Prototype | Real URL | Rendering | Notes |
|---|---|---|---|
| `#home` | `/` | Static, revalidated every 10 min (ISR) | Hero, trust strip, categories, best sellers, promo + countdown, reviews |
| `#shop` | `/shop` | Server-rendered | Filters and sort live in the query string: `/shop?category=beauty&price=1000-3000&rating=4&sort=price-asc&q=watch` |
| `#shop-beauty` | `/category/beauty` | ISR | Indexable category pages |
| `#deals` | `/deals` | ISR | Products with 35%+ off |
| `#product-2` | `/product/wireless-headphones` | ISR (revalidate on product update) | Use the `slug` |
| `#cart` | `/cart` | Client (`noindex`) | Coupon, quantity, move to wishlist |
| `#wishlist` | `/account/wishlist` | Client (`noindex`) | Guests keep it locally; merge into the account on login |
| `#checkout` | `/checkout` | Client, login required (`noindex`) | Address → delivery speed → payment method → Pay |
| `#confirmed-SM10440` | `/order/SM10440/confirmed` | Server, owner only | |
| `#login` | `/login?next=/checkout` | Client | Phone → OTP → name (new users) |
| `#orders` | `/account/orders` | Server, login required | Filter tabs: All, In progress, Delivered, Cancelled |
| `#order-SM10428` | `/account/orders/SM10428` | Server, owner only | Tracking timeline, cancel, return, buy again |
| `#addresses` | `/account/addresses` | Login required | Add, edit, delete, set default |
| `#account` | `/account` | Login required | Profile |
| `#help` | `/help` | Static | FAQ |
| (not in prototype) | `/policies/shipping`, `/policies/returns`, `/policies/privacy`, `/policies/terms`, `/contact` | Static | **Razorpay requires these pages before going live** |
| 404 | `not-found.tsx` | Static | |

Admin (phase 2): `/admin` for products, stock, orders, status updates, refunds, coupons.

---

## 3. Design system

Use the **ShopMate design system** artifact as the source of truth (tokens, components, logo, photos). Put the tokens in `tailwind.config.ts`:

```ts
colors: {
  brand: { 50:'#f4f8f4', 100:'#ecf0e4', 500:'#727f42', 600:'#5f6b35', 700:'#525d2d' },
  sand: { 100:'#f4f0e4' },
  surface: { DEFAULT:'#ffffff', muted:'#f4f4f0' },
  border: { DEFAULT:'#ececea', strong:'#d9d9d4' },
  ink: { 900:'#111111', 700:'#3d3d3a', 500:'#6b6b66', 400:'#8a8a85' },
  star: '#f5b301',
  ok:'#2f7d4f', warn:'#9a6200', bad:'#b03a2e', info:'#2f5f8a',
  cat: { blue:'#e4ecf8', rose:'#fce6e2', butter:'#fcf0dc', lilac:'#e4e0ee', mint:'#dcebe4', peach:'#fce9dc' },
},
borderRadius: { sm:'6px', md:'12px', lg:'20px' },
fontFamily: { sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'] },
```

- Font: **Plus Jakarta Sans** via `next/font/google` (self-hosted automatically, no layout shift).
- Primary buttons use `brand-600` with white text (5.8:1 contrast). `brand-500` with white text fails WCAG AA at small sizes.
- Components to build (all shown in the prototype): Header (search, wishlist/cart/account badges, mobile drawer), ProductCard, CategoryTile, FeatureStrip, PromoBanner + Countdown, Testimonial, Breadcrumbs, FilterSidebar (a drawer on mobile), SortSelect, QuantityStepper, OptionChips, PriceSummary, CouponInput, AddressForm, AddressCard, RadioCard, OrderCard, StatusPill, TrackingTimeline, EmptyState, Toast, Modal, OTPInput, Footer.

---

## 4. Data model (Prisma sketch)

```prisma
model User {
  id        String    @id @default(cuid())
  phone     String    @unique            // E.164, e.g. +919876543210
  name      String
  email     String?
  createdAt DateTime  @default(now())
  addresses Address[]
  orders    Order[]
  wishlist  WishlistItem[]
  cart      CartItem[]
}

model Category { id String @id @default(cuid()); slug String @unique; name String; image String; tint String; products Product[] }

model Product {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String
  highlights  String[]
  specs       Json                         // [{label, value}]
  categoryId  String
  category    Category @relation(fields:[categoryId], references:[id])
  images      String[]
  pricePaise  Int                          // ALWAYS store money in paise (integers)
  mrpPaise    Int
  ratingAvg   Float    @default(0)
  ratingCount Int      @default(0)
  optionName  String?                      // "Size", "Colour"…
  variants    Variant[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Variant { id String @id @default(cuid()); productId String; product Product @relation(fields:[productId], references:[id]); value String; sku String @unique; stock Int }

model Address {
  id String @id @default(cuid()); userId String; user User @relation(fields:[userId], references:[id])
  name String; phone String; line1 String; line2 String?; city String; state String; pincode String
  type String  // Home | Work | Other
  isDefault Boolean @default(false)
}

model CartItem     { id String @id @default(cuid()); userId String; user User @relation(fields:[userId], references:[id]); variantId String; qty Int; @@unique([userId, variantId]) }
model WishlistItem { id String @id @default(cuid()); userId String; user User @relation(fields:[userId], references:[id]); productId String; @@unique([userId, productId]) }

model Coupon { code String @id; type String /* percent|flat */; value Int; maxDiscountPaise Int?; minOrderPaise Int @default(0); isActive Boolean; expiresAt DateTime?; perUserLimit Int @default(1) }

model Order {
  id              String   @id                 // human ID, e.g. SM10440
  userId          String
  user            User     @relation(fields:[userId], references:[id])
  status          OrderStatus @default(PENDING_PAYMENT)
  items           OrderItem[]
  addressSnapshot Json                          // copy the address at order time
  delivery        String                        // standard | express
  paymentMethod   String                        // upi | card | netbanking | wallet | cod
  subtotalPaise   Int
  discountPaise   Int
  couponCode      String?
  shippingPaise   Int
  feesPaise       Int                           // express + COD fee
  totalPaise      Int
  razorpayOrderId   String? @unique
  razorpayPaymentId String? @unique
  awb             String?                       // courier tracking number
  events          OrderEvent[]
  createdAt       DateTime @default(now())
}
enum OrderStatus { PENDING_PAYMENT CONFIRMED PACKED SHIPPED OUT_FOR_DELIVERY DELIVERED CANCELLED RETURN_REQUESTED RETURNED REFUNDED PAYMENT_FAILED }
model OrderItem  { id String @id @default(cuid()); orderId String; order Order @relation(fields:[orderId], references:[id]); variantId String; name String; option String?; image String; unitPaise Int; qty Int }
model OrderEvent { id String @id @default(cuid()); orderId String; order Order @relation(fields:[orderId], references:[id]); status OrderStatus; note String?; at DateTime @default(now()) }
```

---

## 5. Business rules (as shown in the prototype)

- Prices **include GST**. Show MRP struck through and "Save ₹X (Y%)".
- **Delivery:** free when (subtotal − coupon) ≥ ₹999, otherwise ₹79. Express adds ₹149 (1–2 days, metro cities). Standard takes 3–5 business days.
- **Cash on delivery:** +₹49, only for orders ≤ ₹10,000.
- **Coupons:** `WELCOME10` = 10% off, max ₹500. `SAVE200` = ₹200 off orders ≥ ₹1,999. Validate on the server.
- **Cancel** allowed while CONFIRMED or PACKED. **Return** allowed within 30 days of delivery.
- **Order ID** format: `SM` + sequence (`SM10440`).
- **Pincode check** on the product page. Start with a serviceable-pincode table; later use the courier's API (Shiprocket, Delhivery).
- Max quantity is 10 per line.

---

## 6. API (Next.js route handlers or server actions)

| Method & path | Purpose |
|---|---|
| `GET /api/products?category&price&rating&sale&sort&q&page` | Listing (also used by the server-rendered `/shop`) |
| `GET /api/products/[slug]` | Product detail |
| `POST /api/auth/otp/send` `{phone}` | Send OTP. Rate limit: 3 per 10 min per phone and per IP |
| `POST /api/auth/otp/verify` `{phone, code}` | Verify, create the session cookie, return `{isNew}` |
| `POST /api/auth/profile` `{name, email?}` | Complete signup |
| `POST /api/auth/logout` | |
| `GET/POST/PATCH/DELETE /api/cart` | Cart lines (guest cart lives in localStorage and merges on login) |
| `POST /api/cart/coupon` `{code}` / `DELETE` | Apply or remove a coupon |
| `GET/POST/DELETE /api/wishlist` | |
| `GET/POST/PATCH/DELETE /api/addresses` | Includes set-default |
| `POST /api/checkout/quote` `{addressId, delivery, paymentMethod}` | Server recalculates every price. **Never trust the browser's totals** |
| `POST /api/checkout/create-order` | Creates an Order (PENDING_PAYMENT) and a **Razorpay Order**; returns `{orderId, razorpayOrderId, amount, keyId}`. COD skips Razorpay and confirms directly |
| `POST /api/checkout/verify` `{razorpay_order_id, razorpay_payment_id, razorpay_signature}` | Verifies the signature, marks CONFIRMED, decrements stock, clears the cart |
| `POST /api/webhooks/razorpay` | `payment.captured`, `payment.failed`, `refund.processed`. Verify the `X-Razorpay-Signature` header |
| `GET /api/orders` / `GET /api/orders/[id]` | Owner only |
| `POST /api/orders/[id]/cancel` `{reason}` | Cancel; triggers a Razorpay refund for prepaid orders |
| `POST /api/orders/[id]/return` `{reason}` | Return request |

---

## 7. Razorpay flow (replaces the prototype's "Payment simulator")

1. Customer taps **Pay ₹X** → client calls `POST /api/checkout/create-order`.
2. Server recomputes the total, creates the DB order (PENDING_PAYMENT), then calls the Razorpay Orders API with the `amount` in paise, `currency: "INR"` and `receipt: orderId`.
3. Client loads `https://checkout.razorpay.com/v1/checkout.js` **only on the checkout page** and opens Razorpay Checkout with `key` (public key ID), `order_id`, `amount`, the `prefill` name/phone/email and `theme.color: "#5f6b35"`. Razorpay shows UPI, cards, net banking and wallets. **Your site never touches card or UPI details.**
4. On success, Razorpay returns `razorpay_payment_id`, `razorpay_order_id` and `razorpay_signature`. The client sends these to `POST /api/checkout/verify`.
5. Server verifies: `HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, KEY_SECRET) === razorpay_signature`. If they match, mark CONFIRMED and redirect to `/order/[id]/confirmed`.
6. **Also** handle the `payment.captured` webhook, so orders still confirm if the customer closes the tab after paying. Make it idempotent (unique `razorpayPaymentId`).
7. Failure or closed popup → show the prototype's messages: "Payment failed and no money was taken…" / "Payment was cancelled. Your cart is saved…". Keep the cart.
8. Refunds on cancel/return: Razorpay Refunds API; the `refund.processed` webhook moves the order to REFUNDED.

Keys live in env vars: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Use **test mode** keys until launch. Going live needs Razorpay KYC and the policy pages from section 2.

---

## 8. SEO checklist

- Server-render all public pages (`/`, `/shop`, `/category/*`, `/product/*`, `/deals`, `/help`, policies).
- Unique `<title>` and meta description per page via `generateMetadata`, e.g. "Wireless Headphones – ₹2,999 | ShopMate".
- Canonical URLs; filter combinations on `/shop` get `noindex, follow` except single-category views.
- `app/sitemap.ts` (products + categories) and `app/robots.ts`. Block `/cart`, `/checkout`, `/account`, `/api`.
- **JSON-LD:** `Product` + `Offer` (price, `priceCurrency: INR`, availability) + `AggregateRating` on product pages; `BreadcrumbList` on product and category pages; `Organization` + `WebSite` (with SearchAction) on the home page.
- Open Graph and Twitter images per product.
- Descriptive `alt` text on every product image; one `<h1>` per page; semantic headings.
- `hreflang="en-IN"`; fast mobile pages (Google ranks the mobile version).

## 9. Performance targets

- Core Web Vitals (mobile, 75th percentile): **LCP < 2.0 s, INP < 200 ms, CLS < 0.05**.
- Mostly React Server Components; client components only where there's interaction (cart, filters, checkout).
- `next/image` with `sizes`, AVIF/WebP, `priority` on the hero image only.
- `next/font` for Plus Jakarta Sans with `display: swap`.
- Load Razorpay's script only on `/checkout`.
- Cache product and category pages with ISR; revalidate by tag when the admin edits a product.
- Database in Mumbai (`ap-south-1`); hosting region close to it.
- Keep the page's own JS small (aim < 100 KB gzipped); check with `@next/bundle-analyzer`.

## 10. Security checklist

- Session in an **httpOnly, Secure, SameSite=Lax** cookie; no tokens in localStorage.
- OTP: 6 digits, 5-minute expiry, hashed in the DB, max 5 attempts, rate limits per phone and IP (Upstash Ratelimit or similar).
- Validate every input with Zod; check ownership on every order/address request.
- **All prices, discounts, stock and totals are computed on the server.**
- Verify Razorpay payment signatures **and** webhook signatures; make webhook handling idempotent.
- Secrets only in server env vars; never prefix secrets with `NEXT_PUBLIC_`.
- Security headers: Content-Security-Policy (allow `checkout.razorpay.com` and `api.razorpay.com`), HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors.
- Use Prisma (parameterised queries); escape user content; CSRF protection for form posts (SameSite cookies + origin check).
- Log payment events; alert on webhook failures.
- Comply with India's DPDP Act: privacy policy, consent for marketing emails (the profile page's checkbox), data deletion on request.

---

## 11. Build order: prompts to give Claude Code, one at a time

Run `claude` in an empty folder and paste these in order. After each step, run the app and compare it with the prototype.

1. "Read `shopmate-build-spec.md`. Create a Next.js App Router project with TypeScript, Tailwind, ESLint and Prisma. Set up the Tailwind tokens and Plus Jakarta Sans from section 3. Build the Header and Footer to match `shopmate-prototype.html`, including the mobile drawer."
2. "Add the Prisma schema from section 4, connect Postgres, and write a seed script with the 10 products and 6 categories from the prototype (prices in paise)."
3. "Build the home page and the ProductCard, CategoryTile, FeatureStrip, PromoBanner and Testimonial components to match the prototype. Server components where possible."
4. "Build `/shop`, `/category/[slug]` and `/deals` with server-side filtering and sorting from the URL query, the filter sidebar (a drawer on mobile), filter chips and empty state."
5. "Build `/product/[slug]` with gallery zoom, option chips, quantity, Add to Cart, Buy Now, pincode check, tabs, related products, `generateMetadata` and Product JSON-LD."
6. "Add cart and wishlist: guest storage in localStorage, server storage for logged-in users, merging on login. Build `/cart` with the price summary, coupons and the free-delivery meter."
7. "Add phone-OTP login (section 6 and 10) with a mock SMS provider in development, plus `/login` with the three steps from the prototype."
8. "Build `/checkout` (address, delivery speed, payment method), `/api/checkout/quote` and `create-order`. Integrate Razorpay Standard Checkout in test mode with signature verification and the webhook (section 7)."
9. "Build the account area: `/account`, `/account/orders` with filter tabs, `/account/orders/[id]` with the tracking timeline, cancel/return modals with refunds, and `/account/addresses`."
10. "Add the help page, the policy pages, `sitemap.ts`, `robots.ts`, security headers and the SEO items from section 8. Then run Lighthouse on mobile and fix anything under 90."
11. (Later) "Build `/admin` for products, stock, order status updates and refunds."

---

## 12. What's placeholder in the prototype

- Product descriptions, specs, options, ratings counts, and the 5 extra products (tee, chair, serum, tote, plant).
- Prices converted to ₹ as examples; set real prices.
- Sample orders `SM10419–SM10433` (marked "Sample") exist only to preview every status.
- Contact details on the Help page.
- Photos are Unsplash stand-ins; use your own product photography.
- The Razorpay step is a simulator; the real popup comes from Razorpay (section 7).
