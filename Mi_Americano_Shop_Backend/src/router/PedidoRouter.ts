import { Router } from "oak";
import { ControllerPedido } from "../Controller/pedidoController.ts";
import type { ModelDB } from "../interface/model.ts";
import { Pedido } from "../schemas/pedido.ts";
import { User } from "../schemas/user.ts";
import { Producto } from "../schemas/producto.ts";

export function routerPedido(
  pedidoModel: ModelDB<Pedido, Pedido>,
  userModel: ModelDB<User>,
  productoModel: ModelDB<Producto, Producto>,
) {
  const router = new Router();
  const controller = new ControllerPedido(
    pedidoModel,
    userModel,
    productoModel,
  );

  // --- Listar todos los pedidos ---
  router.get("/pedidos", async (ctx) => {
    try {
      const url = ctx.request.url;
      const page = Number(url.searchParams.get("page")) || 1;
      const limit = Number(url.searchParams.get("limit")) || 20;

      // Simular contexto de autenticación
      const context = {
        userId: ctx.request.headers.get("x-user-id") || "",
        role: ctx.request.headers.get("x-user-role") || "vendedor",
      };

      const pedidos = await controller.getAllPedidos({ context, page, limit });

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: pedidos,
        pagination: { page, limit, total: pedidos.length },
      };
    } catch (error) {
      console.error("Error GET /pedidos:", error);
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Error al obtener pedidos",
      };
    }
  });

  // --- Obtener pedido por ID ---
  router.get("/pedidos/:id", async (ctx) => {
    try {
      const id = String(ctx.params.id);
      const context = {
        userId: ctx.request.headers.get("x-user-id") || "",
        role: ctx.request.headers.get("x-user-role") || "vendedor",
      };

      const pedido = await controller.getPedidoById({ id, context });

      if (!pedido) {
        ctx.response.status = 404;
        ctx.response.body = { success: false, error: "Pedido no encontrado" };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = { success: true, data: pedido };
    } catch (error) {
      console.error("Error GET /pedidos/:id:", error);
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Error al obtener pedido",
      };
    }
  });

  // --- Crear un pedido ---
  router.post("/pedidos", async (ctx) => {
    try {
      const body = ctx.request.body.json();
      const pedidoData = await body;

      const context = {
        userId: ctx.request.headers.get("x-user-id") || "",
        role: ctx.request.headers.get("x-user-role") || "vendedor",
      };

      const pedido = await controller.createPedido({
        pedido: pedidoData,
        context,
      });

      ctx.response.status = 201;
      ctx.response.body = {
        success: true,
        data: pedido,
        message: "Pedido creado exitosamente",
      };
    } catch (error) {
      console.error("Error POST /pedidos:", error);
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear pedido",
      };
    }
  });

  // --- Actualizar un pedido ---
  router.put("/pedidos/:id", async (ctx) => {
    try {
      const id = String(ctx.params.id);
      const body = ctx.request.body.json();
      const pedidoData = await body;

      const context = {
        userId: ctx.request.headers.get("x-user-id") || "",
        role: ctx.request.headers.get("x-user-role") || "vendedor",
      };

      const pedidoActualizado = await controller.updatePedido({
        id,
        pedido: pedidoData,
        context,
      });

      if (!pedidoActualizado) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          error: "Pedido no encontrado o sin permisos",
        };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: pedidoActualizado,
        message: "Pedido actualizado exitosamente",
      };
    } catch (error) {
      console.error("Error PUT /pedidos/:id:", error);
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Error al actualizar pedido",
      };
    }
  });

  // --- Eliminar un pedido ---
  router.delete("/pedidos/:id", async (ctx) => {
    try {
      const id = String(ctx.params.id);
      const context = {
        userId: ctx.request.headers.get("x-user-id") || "",
        role: ctx.request.headers.get("x-user-role") || "vendedor",
      };

      const eliminado = await controller.deletePedido({ id, context });

      if (!eliminado) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          error: "Pedido no encontrado o sin permisos",
        };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Pedido eliminado exitosamente",
      };
    } catch (error) {
      console.error("Error DELETE /pedidos/:id:", error);
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Error al eliminar pedido",
      };
    }
  });

  return router;
}
