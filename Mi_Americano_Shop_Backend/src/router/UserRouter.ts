import { Router } from "oak";
import { UserController } from "../Controller/controllerUser.ts";
import type { UserModelDB } from "../interface/UserModel.ts";
import { AuthContext } from "../types/AuthContext.ts";
import { authMiddleware } from "../middleware/authMiddleware.ts"; // tu middleware

export function routerUser(userInstance: UserModelDB) {
  const routerUser = new Router();
  const user = new UserController(userInstance);

  routerUser
    // 🔒 Ruta protegida con middleware
    .get("/user", authMiddleware(userInstance), async (ctx) => {
      // acá ya tenés disponible ctx.state.user
      const loggedUser = ctx.state.user;

      const auth: AuthContext = {
        userId: loggedUser.id,
        role: loggedUser.role,
      };

      const url = ctx.request.url;
      const page = Number(url.searchParams.get("page")) || 1;
      const limit = Number(url.searchParams.get("limit")) || 10;
      const email = url.searchParams.get("email") || "";
      const name = url.searchParams.get("nombre") || "";

      const users = await user.getAll({ name, email, page, limit, user: auth });

      ctx.response.body = {
        loggedUser, // ejemplo: mostrar quién pidió los datos
        users,
      };
    })
    .get("/user/:id", authMiddleware(userInstance), async (ctx) => {
      const loggedUser = ctx.state.user; // payload del JWT
      const id = String(ctx.params.id);

      const data = await user.getById({ id });

      ctx.response.body = {
        requestedBy: loggedUser.email,
        data,
      };
    })
    .post("/user", async (ctx) => {
      // 🚨 Ruta pública (ejemplo: registro)
      const body = ctx.request.body.json();
      const value = await body;

      const result = await user.create({ data: value });
      ctx.response.body = result;
    })
    .put("/user/:id", authMiddleware(userInstance), async (ctx) => {
      const id = String(ctx.params.id);
      const body = ctx.request.body.json();
      const value = await body;

      const result = await user.update({ id, data: value });
      ctx.response.body = result;
    })
    .delete("/user/:id", authMiddleware(userInstance), async (ctx) => {
      const id = String(ctx.params.id);
      const result = await user.delete({ id });
      ctx.response.body = result;
    });

  return routerUser;
}
