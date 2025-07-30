import { Router } from "oak";
import { ProductoController } from "../Controller/controllerProducto.ts";
import type { ModelDB } from "../interface/model.ts";
import { Producto } from "../schemas/producto.ts";

export function routerProducto(producto: ModelDB<Producto>) {
  const routerProducto = new Router();
  const controller = new ProductoController(producto);

  routerProducto
    .get("/productos", async (ctx) => {
      try {
        const url = ctx.request.url;
        const page = Number(url.searchParams.get("page")) || 1;
        const limit = Number(url.searchParams.get("limit")) || 10;
        const name = url.searchParams.get("nombre") || "";
        const precioParam = url.searchParams.get("precio");
        const precio = precioParam ? Number(precioParam) : undefined;
        const talle = url.searchParams.get("talle") || "";
        const vendedor = url.searchParams.get("vendedor") || "";

        const params = {
          name,
          precio,
          talle,
          vendedor,
          page,
          limit,
        };

        const productos = await controller.getAll(params);
        ctx.response.status = 200;
        ctx.response.body = productos;
      } catch (error) {
        console.error(error);
        ctx.response.status = 500;
        ctx.response.body = {
          error: "Error al obtener productos",
        };
      }
    })
    .get("/productos/:id", async (ctx) => {
      try {
        const id = String(ctx.params.id);
        const data = await controller.getById({ id });
        ctx.response.status = 200;
        ctx.response.body = data;
      } catch (error) {
        console.error(error);

        ctx.response.body = {
          error: "Error al obtener producto",
        };
      }
    })
    .post("/productos", async (ctx) => {
      try {
        const body = ctx.request.body.json();
        const value = await body;
        const result = await controller.create({ data: value });
        ctx.response.status = 201;
        ctx.response.body = result;
      } catch (error) {
        console.error(error);
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Error al crear producto",
        };
      }
    })
    .put("/productos/:id", async (ctx) => {
      try {
        const id = String(ctx.params.id);
        const body = ctx.request.body.json();
        const value = await body;
        const result = await controller.update({ id, data: value });
        ctx.response.status = 200;
        ctx.response.body = result;
      } catch (error) {
        console.error(error);
        ctx.response.body = {
          error: "Error al actualizar producto",
        };
      }
    })
    .delete("/productos/:id", async (ctx) => {
      try {
        const id = String(ctx.params.id);
        const result = await controller.delete({ id });
        ctx.response.status = 200;
        ctx.response.body = result;
      } catch (error) {
        console.error(error);
        ctx.response.body = {
          error: "Error al eliminar producto",
        };
      }
    });

  return routerProducto;
}
