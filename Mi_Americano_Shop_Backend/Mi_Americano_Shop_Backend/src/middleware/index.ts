// src/middleware/index.ts
import { oakCors } from "oakCors";
import { config } from "dotenv";
import type { Middleware } from "oak";

config({ export: true });

const originsEnv = Deno.env.get("ALLOWED_ORIGINS") ?? "";
const allowedOrigins = originsEnv
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isDev = Deno.env.get("ENV") === "development";

export const corsMiddleware: Middleware = oakCors({
  origin: (requestOrigin) => {
    if (isDev) return true;
    return allowedOrigins.includes(requestOrigin ?? "");
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
});

export const timingMiddleware: Middleware = async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
  console.log(`${ctx.request.method} ${ctx.request.url} - ${ms}ms`);
};
