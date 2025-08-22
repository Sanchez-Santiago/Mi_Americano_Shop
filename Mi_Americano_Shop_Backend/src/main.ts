// src/main.ts
import { Application } from "oak";
import { config } from "dotenv";
import routerHome from "./router/HomeRouter.ts";
import { routerProducto } from "./router/ProductoRouter.ts";
import { routerUser } from "./router/UserRouter.ts";
import { authRouter } from "./router/AuthRouter.ts";
import { corsMiddleware, timingMiddleware } from "./middleware/index.ts";
import { ProductoSQLite } from "./model/ProductoSQLite.ts";
import { UserSQLite } from "./model/UserSQLite.ts";

config({ export: true });

const app = new Application();
const PORT = Number(Deno.env.get("PORT")) || 8000;

//Modelos
const productoInstance = new ProductoSQLite();
const userInstance = new UserSQLite();

// Middlewares
app.use(corsMiddleware);
app.use(timingMiddleware);

// Routers
app.use(routerHome.routes());
app.use(routerHome.allowedMethods());

const productoRouter = routerProducto(productoInstance);

app.use(productoRouter.routes());
app.use(productoRouter.allowedMethods());

const userRouter = routerUser(userInstance);

app.use(userRouter.routes());
app.use(userRouter.allowedMethods());

const authRoutes = authRouter(userInstance);

app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());

console.log(`Servidor corriendo en http://localhost:${PORT}`);
await app.listen({ port: PORT });
