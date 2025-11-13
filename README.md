# Ayush Grocery Mart

A demo e-commerce storefront for a rural South Indian grocery shop, built on Cloudflare Pages with Pages Functions.

## Project structure

```
public/            # Static assets routed by Pages
src/               # React application (Vite + Tailwind)
  context/AuthContext.tsx # Client auth provider (localStorage, JWT handling)
  hooks/useAccount.ts     # Account/profile data fetcher + mutations
  pages/AuthPage.tsx      # Shared UI for login/register flows
  pages/AccountPage.tsx   # Account + saved address management UI
functions/         # Cloudflare Pages Functions (filesystem-routed)
  products.js      # GET /products (inventory feed)
  order.js         # GET/POST /order (checkout + status updates)
  config.js        # GET/PUT /config (delivery economics)
  auth/            # Auth endpoints
    register.js    # POST /auth/register
    login.js       # POST /auth/login
  me.js          # GET /auth/me
  _auth.js         # Shared auth helpers (hashing, JWT signing)
migrations/        # D1 schema migrations (orders, admin_config, users, user_addresses)
```

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Provide required environment secrets:
   - `ORDERS_DB`: D1 binding configured via `wrangler.toml`.
   - `AUTH_SECRET`: at least 16 characters; used to sign auth tokens.
3. Start the Cloudflare Pages dev server (functions in `functions/` are picked up automatically):
   ```bash
   npm run dev
   ```

## Deploying

1. Authenticate with Cloudflare if you have not already:
   ```bash
   npx wrangler login
   ```
2. Create the Pages project (first time only):
   ```bash
   npx wrangler pages project create ayush-grocery-pages
   ```
3. Deploy:
   ```bash
   npm run deploy
   ```
4. In the Cloudflare dashboard, assign your custom domain once the build completes.

### D1 migrations

Run migrations against the local D1 instance:

```bash
npx wrangler d1 migrations apply order_ieeja_orders --local
```

Apply to the remote database when ready:

```bash
npx wrangler d1 migrations apply order_ieeja_orders --remote
```

### Auth endpoints

- `POST /auth/register` expects `{ phone, password, displayName? }`, stores a PBKDF2 hash, and returns a signed JWT.
- `POST /auth/login` expects `{ phone, password }`, verifies stored hash, and returns `{ user, token }`.
- `GET /auth/me` reads the `Authorization: Bearer <token>` header and resolves the active user.
- `GET /order` returns all orders for admins/riders and automatically scopes to the signed-in customer’s `user_id` otherwise; `PATCH /order` and `GET/PUT /config` remain staff-only.
- `/account` (GET) returns the profile + saved addresses for the signed-in user. `/account/profile` (PUT) updates names, and `/account/addresses` (GET/POST/PUT/PATCH/DELETE) manages saved delivery addresses (with default handling).
- Logged-in customers place orders with the same `/order` endpoint; the Worker links `orders.user_id`, snapshots the address, and stores/updates the reusable address in the new `user_addresses` table (plus `users.primary_address_json` for the default).

### Authentication UI

- Visit `/auth/login` or `/auth/register` from the navigation bar to access the new forms.
- Successful sign-in redirects riders/admins to their consoles (and customers to `/orders`), while `SiteNav` exposes shortcuts plus a logout control.
- Admin/Rider routes now use an in-app guard, so unauthenticated visitors are redirected to `/auth/login`.

MSG91-driven OTP verification will be layered on top of this flow in a future update.

## Next steps

- Tweak the inventory for real products and pricing.
- Capture delivery details (customer name, phone, address) in the checkout flow.
- Persist orders using Cloudflare D1, KV, or queue integrations.
- Add bilingual support for Tamil and English to serve local customers.
