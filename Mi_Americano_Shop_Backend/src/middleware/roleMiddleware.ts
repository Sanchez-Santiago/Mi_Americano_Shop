// middlewares/roleMiddleware.ts
import { Middleware } from "oak";

export function roleMiddleware(...rolesPermitidos: string[]): Middleware {
  return async (ctx, next) => {
    const user = ctx.state.user;
    if (!user || !rolesPermitidos.includes(user.rol)) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Acceso no autorizado" };
      return;
    }
    await next();
  };
}
