import { handleProfile, jsonResponse } from "../_auth";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }
  return handleProfile(context);
}
