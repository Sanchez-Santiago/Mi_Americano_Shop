import { Pedido, PedidoCreate } from "../schemas/pedido.ts";
import { Producto } from "../schemas/producto.ts";
import { User, UserSecure } from "../schemas/user.ts";
import { ModelDB } from "../interface/model.ts";

type Role = "admin" | "vendedor" | string;

interface AuthContext {
  userId: string;
  role: Role;
}

export class ServicePedido {
  constructor(
    private pedidoModel: ModelDB<Pedido, Pedido>,
    private userModel: ModelDB<User, UserSecure>,
    private productoModel: ModelDB<Producto, Producto>,
  ) {}

  async createPedido({
    pedido,
    context,
  }: {
    pedido: PedidoCreate;
    context: AuthContext;
  }): Promise<Pedido> {
    try {
      // Verificamos que el producto exista
      const producto = await this.productoModel.getById({
        id: pedido.idProducto,
        context,
      });

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      // Verificamos que el producto tenga stock válido
      if (typeof producto.stock !== "number" || producto.stock < 0) {
        throw new Error("Producto sin stock válido");
      }

      // Verificamos si hay suficiente stock
      if (producto.stock < pedido.cantidad) {
        throw new Error(
          `Stock insuficiente. Disponible: ${producto.stock}, Solicitado: ${pedido.cantidad}`,
        );
      }

      // Verificamos que el cliente exista
      const cliente = await this.userModel.getById({
        id: pedido.idCliente,
        context,
      });

      if (!cliente) {
        throw new Error("Cliente no encontrado");
      }

      // Creamos el pedido completo
      const pedidoCompleto: Pedido = {
        ...pedido,
        fechaCreacion: new Date(),
        estado: pedido.estado || "pendiente",
      };

      // Agregamos el pedido a la base de datos
      const pedidoCreado = await this.pedidoModel.add({
        input: pedidoCompleto,
      });

      // Actualizamos el stock del producto
      const nuevoStock = producto.stock - pedido.cantidad;
      await this.productoModel.update({
        id: pedido.idProducto,
        input: { stock: nuevoStock },
        context,
      });

      return pedidoCreado;
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error inesperado al crear el pedido");
    }
  }

  async getPedidoById({
    id,
    context,
  }: {
    id: string;
    context: AuthContext;
  }): Promise<Pedido | undefined> {
    try {
      return await this.pedidoModel.getById({ id, context });
    } catch (error) {
      console.error("Error al obtener pedido por ID:", error);
      throw new Error("Error al obtener el pedido");
    }
  }

  async getAllPedidos({
    context,
    page = 1,
    limit = 20,
    vendedorId,
    name,
    email,
    precio,
    talle,
  }: {
    context: AuthContext;
    page?: number;
    limit?: number;
    vendedorId?: string;
    name?: string;
    email?: string;
    precio?: number;
    talle?: string;
  }): Promise<Pedido[]> {
    try {
      const pedidos = await this.pedidoModel.getAll({
        context,
        page,
        limit,
        vendedorId,
        name,
        email,
        precio,
        talle,
      });

      return pedidos || [];
    } catch (error) {
      console.error("Error al obtener todos los pedidos:", error);
      throw new Error("Error al obtener los pedidos");
    }
  }

  async updatePedido({
    id,
    pedido,
    context,
  }: {
    id: string;
    pedido: Partial<Pedido>;
    context: AuthContext;
  }): Promise<Pedido | undefined> {
    try {
      // Obtenemos el pedido actual
      const pedidoActual = await this.pedidoModel.getById({ id, context });
      if (!pedidoActual) {
        throw new Error("Pedido no encontrado o sin permisos");
      }

      // Si se está actualizando la cantidad, verificamos el stock
      if (
        pedido.cantidad !== undefined &&
        pedido.cantidad !== pedidoActual.cantidad
      ) {
        const producto = await this.productoModel.getById({
          id: pedidoActual.idProducto,
          context,
        });

        if (!producto) {
          throw new Error("Producto asociado no encontrado");
        }

        if (typeof producto.stock !== "number") {
          throw new Error("Stock del producto no válido");
        }

        // Calculamos el stock disponible (stock actual + cantidad del pedido actual)
        const stockDisponible = producto.stock + pedidoActual.cantidad;

        if (stockDisponible < pedido.cantidad) {
          throw new Error(
            `Stock insuficiente. Disponible: ${stockDisponible}, Solicitado: ${pedido.cantidad}`,
          );
        }

        // Actualizamos el stock del producto
        const diferenciaCantidad = pedido.cantidad - pedidoActual.cantidad;
        const nuevoStock = producto.stock - diferenciaCantidad;

        await this.productoModel.update({
          id: pedidoActual.idProducto,
          input: { stock: nuevoStock },
          context,
        });
      }

      // Actualizamos el pedido
      const pedidoActualizado = await this.pedidoModel.update({
        id,
        input: pedido,
        context,
      });

      return pedidoActualizado;
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error inesperado al actualizar el pedido");
    }
  }

  async deletePedido({
    id,
    context,
  }: {
    id: string;
    context: AuthContext;
  }): Promise<boolean> {
    try {
      // Primero obtenemos el pedido para restaurar el stock
      const pedido = await this.pedidoModel.getById({ id, context });
      if (!pedido) {
        throw new Error("Pedido no encontrado o sin permisos");
      }

      // Obtenemos el producto para restaurar el stock
      const producto = await this.productoModel.getById({
        id: pedido.idProducto,
        context,
      });

      if (producto && typeof producto.stock === "number") {
        // Restauramos el stock
        const stockRestaurado = producto.stock + pedido.cantidad;
        await this.productoModel.update({
          id: pedido.idProducto,
          input: { stock: stockRestaurado },
          context,
        });
      }

      // Eliminamos el pedido
      return await this.pedidoModel.delete({ id, context });
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error inesperado al eliminar el pedido");
    }
  }

  async cambiarEstadoPedido({
    id,
    nuevoEstado,
    context,
  }: {
    id: string;
    nuevoEstado: Pedido["estado"];
    context: AuthContext;
  }): Promise<Pedido | undefined> {
    try {
      return await this.pedidoModel.update({
        id,
        input: { estado: nuevoEstado },
        context,
      });
    } catch (error) {
      console.error("Error al cambiar estado del pedido:", error);
      throw new Error("Error al cambiar el estado del pedido");
    }
  }

  async getPedidosPorVendedor({
    vendedorId,
    context,
    page = 1,
    limit = 20,
  }: {
    vendedorId: string;
    context: AuthContext;
    page?: number;
    limit?: number;
  }): Promise<Pedido[]> {
    try {
      // Solo admin puede ver pedidos de otros vendedores
      if (context.role !== "admin" && context.userId !== vendedorId) {
        throw new Error("Sin permisos para ver pedidos de otro vendedor");
      }

      const pedidos = await this.pedidoModel.getAll({
        context,
        vendedorId,
        page,
        limit,
      });

      return pedidos || [];
    } catch (error) {
      console.error("Error al obtener pedidos por vendedor:", error);
      throw new Error("Error al obtener los pedidos del vendedor");
    }
  }
}
