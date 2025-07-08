import { Router } from "oak";

const routerHome = new Router();

routerHome.get("/", (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = { message: "Hola mundo" };
});

export default routerHome;
