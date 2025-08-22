// routes/auth.ts
import { Router } from "oak";
import { AuthController } from "../Controller/AuthController.ts";
import { UserModelDB } from "../interface/UserModel.ts";

export function authRouter(userModel: UserModelDB) {
  const router = new Router();
  const authController = new AuthController(userModel);

  // POST /login
  router.post("/login", async (ctx) => {
    try {
      const body = ctx.request.body.json();
      const input = await body;
      const result = await authController.login(input);

      ctx.response.status = 200;
      ctx.response.body = { success: true, data: result };
    } catch (error) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: error };
    }
  });

  // POST /register
  router.post("/register", async (ctx) => {
    try {
      const body = ctx.request.body.json();
      const userData = await body;
      const token = await authController.register(userData);

      ctx.response.status = 201;
      ctx.response.body = { success: true, token };
    } catch (error) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, message: error };
    }
  });

  // GET /verify
  router.get("/verify", async (ctx) => {
    try {
      const token = ctx.request.headers.get("Authorization")?.replace(
        "Bearer ",
        "",
      );
      if (!token) throw new Error("Token requerido");

      const payload = await authController.verifyToken(token);
      ctx.response.status = 200;
      ctx.response.body = { success: true, payload };
    } catch (error) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: error };
    }
  });

  // POST /refresh
  router.post("/refresh", async (ctx) => {
    try {
      const body = ctx.request.body.json();
      const { token: oldToken } = await body;
      const newToken = await authController.refreshToken(oldToken);

      ctx.response.status = 200;
      ctx.response.body = { success: true, token: newToken };
    } catch (error) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, message: error };
    }
  });

  return router;
}
