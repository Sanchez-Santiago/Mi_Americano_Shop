import { Middleware } from "oak";
import { verify } from "djwt";
import { config } from "dotenv";
import type { ModelDB } from "../interface/model.ts";
import { User } from "../schemas/user.ts";
import { UserController } from "../Controller/controllerUser.ts";

config({ export: true });

export const authMiddleware = (model: ModelDB<User>): Middleware => {
  return async (ctx, next) => {
    const userController = new UserController(model);

    try {
      const token = await ctx.cookies.get("token");
      if (!token) {
        ctx.response.status = 401;
        ctx.response.body = { message: "No autorizado: token no presente" };
        return;
      }

      const secret = Deno.env.get("JWT_SECRET");
      if (!secret) throw new Error("JWT_SECRET no definido");

      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"],
      );

      const payload = await verify(token, key);
      if (!payload.iss || typeof payload.iss !== "string") {
        ctx.response.status = 401;
        ctx.response.body = {
          message: "Token sin identificador de usuario válido",
        };
        return;
      }

      const user = await userController.getByIdAuth(payload.iss);
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = { message: "Usuario no válido o eliminado" };
        return;
      }

      ctx.state.user = user; // guarda usuario completo, no solo payload
      await next();
    } catch (error) {
      ctx.response.status = 401;
      ctx.response.body = { message: "Token inválido o expirado" };
      if (Deno.env.get("MODE") === "dev") {
        console.error(error);
      }
    }
  };
};
