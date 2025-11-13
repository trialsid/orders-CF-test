import { handleRegister, jsonResponse } from "../_auth";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }
  return handleRegister(context);
}
