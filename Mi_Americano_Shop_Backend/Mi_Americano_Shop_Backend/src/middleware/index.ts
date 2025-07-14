import { oakCors } from "oakCors";
import { config } from "dotenv";
import type { Middleware } from "oak";
config({ export: true });

// Cargar variables de entorno
config({ export: true });

// Leer origenes permitidos
const originsEnv = Deno.env.get("ALLOWED_ORIGINS") ?? "";
const allowedOrigins = originsEnv
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Detectar si estamos en modo desarrollo
const isDev = Deno.env.get("ENV") === "development";

// Exportar middleware
export const corsMiddleware: Middleware = oakCors({
  origin: isDev ? "*" : allowedOrigins,
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
