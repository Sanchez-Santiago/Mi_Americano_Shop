import { Router } from "oak";
import { UserController } from "../Controller/controllerUser.ts";
import type { ModelDB } from "../interface/model.ts";
import { User, UserSecure } from "../schemas/user.ts";

export function routerUser(userInstance: ModelDB<User, UserSecure>) {
  const routerUser = new Router();
  const user = new UserController(userInstance);
  routerUser
    .get("/user", async (ctx) => {
      const url = ctx.request.url;
      const page = Number(url.searchParams.get("page")) || 1;
      const limit = Number(url.searchParams.get("limit")) || 10;
      const email = url.searchParams.get("email") || "";
      const name = url.searchParams.get("nombre") || "";

      const params = {
        name,
        email,
        page,
        limit,
      };

      const users = await user.getAll(params);
      ctx.response.body = users;
    })
    .get("/user/:id", async (ctx) => {
      const id = String(ctx.params.id);
      const data = await user.getById({ id });
      ctx.response.body = data;
    })
    .post("/user", async (ctx) => {
      const body = ctx.request.body.json();
      const value = await body;
      const result = await user.create({ data: value });
      ctx.response.body = result;
    })
    .put("/user/:id", async (ctx) => {
      const id = String(ctx.params.id);
      const body = ctx.request.body.json();
      const value = await body;
      const result = await user.update({ id, data: value });
      ctx.response.body = result;
    })
    .delete("/user/:id", async (ctx) => {
      const id = String(ctx.params.id);
      const result = await user.delete({ id });
      ctx.response.body = result;
    });

  return routerUser;
}
