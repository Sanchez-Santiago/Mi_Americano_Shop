// src/main.ts
import { Application } from "oak";
import { config } from "dotenv";
import routerHome from "./router/HomeRouter.ts";
import routerProducto from "./router/ProductoRouter.ts";
import { corsMiddleware, timingMiddleware } from "./middleware/index.ts";

config({ export: true });

const app = new Application();
const PORT = Number(Deno.env.get("PORT")) || 8000;

// Middlewares
app.use(corsMiddleware);
app.use(timingMiddleware);

// Routers
app.use(routerHome.routes());
app.use(routerHome.allowedMethods());
app.use(routerProducto.routes());
app.use(routerProducto.allowedMethods());

console.log(`Servidor corriendo en http://localhost:${PORT}`);
await app.listen({ port: PORT });
