import * as products from "./products";
import * as order from "./order";
import * as config from "./config";

const handler = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/products") {
      if (typeof products.onRequest === "function") {
        return products.onRequest({ request, env, ctx });
      }
      if (typeof products.fetch === "function") {
        return products.fetch(request, env, ctx);
      }
    }

    if (url.pathname === "/order") {
      if (request.method === "POST" && typeof order.onRequestPost === "function") {
        return order.onRequestPost({ request, env, ctx });
      }
      if (typeof order.onRequest === "function") {
        return order.onRequest({ request, env, ctx });
      }
      if (typeof order.fetch === "function") {
        return order.fetch(request, env, ctx);
      }
    }

    if (url.pathname === "/config") {
      if (typeof config.onRequest === "function") {
        return config.onRequest({ request, env, ctx });
      }
      if (typeof config.fetch === "function") {
        return config.fetch(request, env, ctx);
      }
    }

    return env.ASSETS.fetch(request);
  }
};

export default handler;
