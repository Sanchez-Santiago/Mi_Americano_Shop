import { Application } from "oak";
import { config } from "dotenv";
import routerHome from "./router/HomeRouter.ts";
import routerProducto from "./router/ProductoRouter.ts";

config({ export: true });

const app = new Application();
const PORT = Number(Deno.env.get("PORT")) || 8000;

/* Middleware de timing */
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
  console.log(`${ctx.request.method} ${ctx.request.url} - ${ms}ms`);
});

/* Routers */
app.use(routerHome.routes());
app.use(routerHome.allowedMethods());
app.use(routerProducto.routes());
app.use(routerProducto.allowedMethods());

console.log(`Servidor corriendo en http://localhost:${PORT}`);
await app.listen({ port: PORT });
