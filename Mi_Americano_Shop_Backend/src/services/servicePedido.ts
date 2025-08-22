import type { ModelDB } from "../interface/model.ts";
import type { AuthContext } from "../types/AuthContext.ts";
import { Pedido } from "../schemas/pedido.ts";
import { Producto } from "../schemas/producto.ts";
import { User } from "../schemas/user.ts";

export class PedidoService {
  constructor(
    private pedidoModel: ModelDB<Pedido>,
    private productoModel: ModelDB<Producto>,
    private userModel: ModelDB<User>,
  ) {}

  async getAll(context: AuthContext, page?: number, limit?: number) {
    const allPedidos = await this.pedidoModel.getAll({ page, limit });

    // Ejemplo: todos pueden ver pedidos
    if (context.role === "admin") {
      return allPedidos;
    }
    const pedidosUser: Pedido[] = [];
    allPedidos?.map((pedido) => {
      if (pedido.idCliente === context.userId) {
        pedidosUser.push(pedido);
      }
    });

    if (!allPedidos && pedidosUser.length !== 0) {
      return pedidosUser;
    }

    return undefined;
  }

  async getById(context: AuthContext, id: string) {
    const pedido = await this.pedidoModel.getById({ id });

    if (!pedido) {
      throw new Error("Pedido no encontrado");
    }

    // Solo el dueño o admin puede ver un pedido específico
    if (
      pedido.idCliente !== context.userId ||
      pedido.idVendedor !== context.userId && context.role !== "admin"
    ) {
      throw new Error("No tienes permisos para ver este pedido");
    }

    return pedido;
  }

  async create(params: { input: Pedido; context: AuthContext }) {
    const { input, context } = params;

    // Verificar que el producto exista
    const producto = await this.productoModel.getById({ id: input.idProducto });
    if (!producto) throw new Error("El producto no existe");

    // Verificar que el comprador exista
    const comprador = await this.userModel.getById({ id: input.idCliente });
    if (!comprador) throw new Error("El comprador no existe");

    // Verificar que el vendedor exista
    const vendedor = await this.userModel.getById({ id: input.idVendedor });
    if (!vendedor) throw new Error("El vendedor no existe");

    // Verificar permisos
    if (context.role !== "admin" && context.userId !== input.idCliente) {
      throw new Error("No tienes permisos para crear este pedido");
    }

    // Crear pedido
    return this.pedidoModel.add({ input });
  }

  async update(context: AuthContext, id: string, input: Partial<Pedido>) {
    const pedido = await this.pedidoModel.getById({ id });

    if (!pedido) {
      throw new Error("Pedido no encontrado");
    }

    // Solo dueño o admin puede modificar
    if (
      pedido.idCliente !== context.userId ||
      pedido.idVendedor !== context.userId && context.role !== "admin"
    ) {
      throw new Error("No tienes permisos para modificar este pedido");
    }

    return await this.pedidoModel.update({ id, input });
  }

  async delete(context: AuthContext, id: string) {
    const pedido = await this.pedidoModel.getById({ id });

    if (!pedido) {
      throw new Error("Pedido no encontrado");
    }

    // Solo dueño o admin puede eliminar
    if (
      pedido.idCliente !== context.userId ||
      pedido.idVendedor !== context.userId && context.role !== "admin"
    ) {
      throw new Error("No tienes permisos para eliminar este pedido");
    }

    return await this.pedidoModel.delete({ id });
  }
}
