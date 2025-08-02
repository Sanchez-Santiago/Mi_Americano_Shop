import { Router } from "oak";
import { ControllerPedido } from "../Controller/controlerPedido.ts";
import type { ModelDB } from "../interface/model.ts";
import { Pedido } from "../schemas/pedido.ts";
import { User, UserSecure } from "../schemas/user.ts";
import { Producto } from "../schemas/producto.ts";

export function routerPedido(
  pedidoModel: ModelDB<Pedido, Pedido>,
  userModel: ModelDB<User, UserSecure>,
  productoModel: ModelDB<Producto, Producto>,
) {
  const routerPedido = new Router();
  const controller = new ControllerPedido(
    pedidoModel,
    userModel,
    productoModel,
  );

  routerPedido
    .get("/pedidos", async (ctx) => {
      try {
        const url = ctx.request.url;
        const page = Number(url.searchParams.get("page")) || 1;
        const limit = Number(url.searchParams.get("limit")) || 20;
        const name = url.searchParams.get("name") || "";
        const email = url.searchParams.get("email") || "";
        const precioParam = url.searchParams.get("precio");
        const precio = precioParam ? Number(precioParam) : undefined;
        const talle = url.searchParams.get("talle") || "";
        const vendedorId = url.searchParams.get("vendedorId") || "";

        // Simular context - en producción esto vendría del middleware de auth
        const context = {
          userId: ctx.request.headers.get("x-user-id") || "",
          role: ctx.request.headers.get("x-user-role") || "vendedor",
        };

        const params = {
          context,
          page,
          limit,
          name: name || undefined,
          email: email || undefined,
          precio,
          talle: talle || undefined,
          vendedorId: vendedorId || undefined,
        };

        const pedidos = await controller.getAllPedidos(params);
        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          data: pedidos,
          pagination: { page, limit, total: pedidos.length },
        };
      } catch (error) {
        console.error("Error en GET /pedidos:", error);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Error al obtener pedidos",
        };
      }
    })
    .get("/pedidos/:id", async (ctx) => {
      try {
        const id = String(ctx.params.id);

        // Simular context - en producción esto vendría del middleware de auth
        const context = {
          userId: ctx.request.headers.get("x-user-id") || "",
          role: ctx.request.headers.get("x-user-role") || "vendedor",
        };

        const pedido = await controller.getPedidoById({ id, context });

        if (!pedido) {
          ctx.response.status = 404;
          ctx.response.body = {
            success: false,
            error: "Pedido no encontrado",
          };
          return;
        }

        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          data: pedido,
        };
      } catch (error) {
        console.error("Error en GET /pedidos/:id:", error);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Error al obtener pedido",
        };
      }
    })
    .post("/pedidos", async (ctx) => {
      try {
        const body = ctx.request.body.json();
        const pedidoData = await body;

        // Simular context - en producción esto vendría del middleware de auth
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
        console.error("Error en POST /pedidos:", error);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Error al crear pedido",
        };
      }
    })
    .put("/pedidos/:id", async (ctx) => {
      try {
        const id = String(ctx.params.id);
        const body = ctx.request.body.json();
        const pedidoData = await body;

        // Simular context - en producción esto vendría del middleware de auth
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
        console.error("Error en PUT /pedidos/:id:", error);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Error al actualizar pedido",
        };
      }
    })
    .delete("/pedidos/:id", async (ctx) => {
      try {
        const id = String(ctx.params.id);

        // Simular context - en producción esto vendría del middleware de auth
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
        console.error("Error en DELETE /pedidos/:id:", error);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Error al eliminar pedido",
        };
      }
    })
    .patch("/pedidos/:id/estado", async (ctx) => {
      try {
        const id = String(ctx.params.id);
        const body = ctx.request.body.json();
        const { estado } = await body;

        if (!estado) {
          ctx.response.status = 400;
          ctx.response.body = {
            success: false,
            error: "Estado requerido",
          };
          return;
        }

        // Simular context - en producción esto vendría del middleware de auth
        const context = {
          userId: ctx.request.headers.get("x-user-id") || "",
          role: ctx.request.headers.get("x-user-role") || "vendedor",
        };

        const pedidoActualizado = await controller.cambiarEstadoPedido({
          id,
          nuevoEstado: estado,
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
          message: "Estado actualizado exitosamente",
        };
      } catch (error) {
        console.error("Error en PATCH /pedidos/:id/estado:", error);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Error al cambiar estado",
        };
      }
    })
    .get("/pedidos/vendedor/:vendedorId", async (ctx) => {
      try {
        const vendedorId = String(ctx.params.vendedorId);
        const url = ctx.request.url;
        const page = Number(url.searchParams.get("page")) || 1;
        const limit = Number(url.searchParams.get("limit")) || 20;

        // Simular context - en producción esto vendría del middleware de auth
        const context = {
          userId: ctx.request.headers.get("x-user-id") || "",
          role: ctx.request.headers.get("x-user-role") || "vendedor",
        };

        const pedidos = await controller.getPedidosPorVendedor({
          vendedorId,
          context,
          page,
          limit,
        });

        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          data: pedidos,
          pagination: { page, limit, total: pedidos.length },
        };
      } catch (error) {
        console.error("Error en GET /pedidos/vendedor/:vendedorId:", error);
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: error instanceof Error
            ? error.message
            : "Error al obtener pedidos del vendedor",
        };
      }
    });

  return routerPedido;
}
