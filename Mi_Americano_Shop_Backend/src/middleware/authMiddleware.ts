import { Middleware } from "oak";
import { verify } from "djwt";
import { config } from "dotenv";
import type { UserModelDB } from "../interface/UserModel.ts";
import { AuthController } from "../Controller/AuthController.ts";

config({ export: true });

/**
 * Middleware de autenticación JWT.
 * - Verifica que el token exista en cookies.
 * - Valida la firma y expiración del token.
 * - Pasa el token plano al AuthController para que el servicio
 *   se encargue de comprobar que corresponde a un usuario válido.
 */
export const authMiddleware = (model: UserModelDB): Middleware => {
  return async (ctx, next) => {
    const authController = new AuthController(model);

    try {
      // 1. Buscar token en cookies
      const token = await ctx.cookies.get("token");
      if (!token) {
        ctx.response.status = 401;
        ctx.response.body = { message: "No autorizado: token no presente" };
        return;
      }

      // 2. Cargar clave secreta desde variables de entorno
      const secret = Deno.env.get("JWT_SECRET");
      if (!secret) throw new Error("JWT_SECRET no definido");

      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"],
      );

      // 3. Validar firma y expiración
      await verify(token, key);

      // 4. Pasar token al AuthController -> service lo valida contra la BD
      const user = await authController.verifyToken(token);
      if (!user) {
        ctx.response.status = 401;
        ctx.response.body = { message: "Usuario no válido" };
        return;
      }

      // 5. Guardar usuario en el contexto para siguientes middlewares/rutas
      ctx.state.user = user;

      // 6. Continuar con la request
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
