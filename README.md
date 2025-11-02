# Ayush Grocery Mart

A demo e-commerce storefront for a rural South Indian grocery shop, built on Cloudflare Pages with Pages Functions.

## Project structure

```
public/           # Static assets and UI
  index.html
  styles.css
  app.js
functions/        # Cloudflare Pages Functions (mini API)
  _inventory.js
  products.js     # GET /products
  order.js        # GET/POST /order
```

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Cloudflare Pages dev server (functions in `functions/` are picked up automatically):
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

## Next steps

- Tweak the inventory for real products and pricing.
- Capture delivery details (customer name, phone, address) in the checkout flow.
- Persist orders using Cloudflare D1, KV, or queue integrations.
- Add bilingual support for Tamil and English to serve local customers.
