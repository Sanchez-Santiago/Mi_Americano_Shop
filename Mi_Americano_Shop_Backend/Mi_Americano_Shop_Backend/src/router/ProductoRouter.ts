import { Router } from "oak";
import { ProductoController } from "../Controller/controler.ts";

const routerProducto = new Router();
const controller = new ProductoController();

routerProducto
  .get("/productos", async (ctx) => {
    const data = await controller.getAll();
    ctx.response.body = data;
  })
  .get("/productos/:id", async (ctx) => {
    const id = Number(ctx.params.id);
    const data = await controller.getById({ id });
    ctx.response.body = data;
  })
  .post("/productos", async (ctx) => {
    const body = ctx.request.body.json();
    const value = await body;
    const result = await controller.create({ data: value });
    ctx.response.body = result;
  })
  .put("/productos/:id", async (ctx) => {
    const id = Number(ctx.params.id);
    const body = ctx.request.body.json();
    const value = await body;
    const result = await controller.update({ id, data: value });
    ctx.response.body = result;
  })
  .delete("/productos/:id", async (ctx) => {
    const id = Number(ctx.params.id);
    const result = await controller.delete({ id });
    ctx.response.body = result;
  });

export default routerProducto;
