import { Pedido, PedidoCreate, PedidoPartial } from "../schemas/pedido.ts";
import { Producto } from "../schemas/producto.ts";
import { User, UserSecure } from "../schemas/user.ts";
import { ServicePedido } from "../services/servicePedido.ts";
import { ModelDB } from "../interface/model.ts";

type Role = "admin" | "vendedor" | string;

interface AuthContext {
  userId: string;
  role: Role;
}

export class ControllerPedido {
  private servicePedido: ServicePedido;

  constructor(
    private pedidoModelDB: ModelDB<Pedido, Pedido>,
    private userModelDB: ModelDB<User, UserSecure>,
    private productoModelDB: ModelDB<Producto, Producto>,
  ) {
    this.servicePedido = new ServicePedido(
      this.pedidoModelDB,
      this.userModelDB,
      this.productoModelDB,
    );
  }

  async createPedido({
    pedido,
    context,
  }: {
    pedido: PedidoPartial;
    context: AuthContext;
  }): Promise<Pedido> {
    // Validación de campos obligatorios
    if (
      !pedido.idCliente ||
      !pedido.idProducto ||
      !pedido.idVendedor ||
      !pedido.cantidad ||
      !pedido.ubicacion
    ) {
      throw new Error(
        "Faltan campos obligatorios: idCliente, idProducto, idVendedor, cantidad, ubicacion",
      );
    }

    // Validación de tipos y valores
    if (typeof pedido.cantidad !== "number" || pedido.cantidad <= 0) {
      throw new Error("La cantidad debe ser un número mayor a 0");
    }

    if (
      typeof pedido.ubicacion !== "string" ||
      pedido.ubicacion.trim().length === 0
    ) {
      throw new Error("La ubicación debe ser una cadena no vacía");
    }

    // Validación de UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(pedido.idCliente)) {
      throw new Error("ID de cliente inválido");
    }

    if (!uuidRegex.test(pedido.idProducto)) {
      throw new Error("ID de producto inválido");
    }

    if (!uuidRegex.test(pedido.idVendedor)) {
      throw new Error("ID de vendedor inválido");
    }

    try {
      // Verificar que el producto existe
      const producto = await this.productoModelDB.getById({
        id: pedido.idProducto,
        context,
      });
      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      // Verificar que el cliente existe
      const cliente = await this.userModelDB.getById({
        id: pedido.idCliente,
        context,
      });
      if (!cliente) {
        throw new Error("Cliente no encontrado");
      }

      // Verificar que el vendedor existe
      const vendedor = await this.userModelDB.getById({
        id: pedido.idVendedor,
        context,
      });
      if (!vendedor) {
        throw new Error("Vendedor no encontrado");
      }

      // Crear el pedido completo
      const pedidoCompleto: PedidoCreate = {
        id: crypto.randomUUID(),
        idCliente: pedido.idCliente,
        idProducto: pedido.idProducto,
        idVendedor: pedido.idVendedor,
        cantidad: pedido.cantidad,
        ubicacion: pedido.ubicacion.trim(),
        estado: "pendiente",
        fechaCreacion: new Date(),
        observaciones: pedido.observaciones?.trim() || undefined,
      };

      return await this.servicePedido.createPedido({
        pedido: pedidoCompleto,
        context,
      });
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
    // Validación del ID
    if (!id || typeof id !== "string") {
      throw new Error("ID de pedido requerido");
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error("ID de pedido inválido");
    }

    try {
      return await this.servicePedido.getPedidoById({ id, context });
    } catch (error) {
      console.error("Error al obtener pedido:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error inesperado al obtener el pedido");
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
    // Validación de parámetros de paginación
    if (page < 1) {
      throw new Error("La página debe ser mayor a 0");
    }

    if (limit < 1 || limit > 100) {
      throw new Error("El límite debe estar entre 1 y 100");
    }

    // Validación del vendedorId si se proporciona
    if (vendedorId) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(vendedorId)) {
        throw new Error("ID de vendedor inválido");
      }
    }

    try {
      return await this.servicePedido.getAllPedidos({
        context,
        page,
        limit,
        vendedorId,
        name,
        email,
        precio,
        talle,
      });
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error inesperado al obtener los pedidos");
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
    // Validación del ID del pedido
    if (!id || typeof id !== "string") {
      throw new Error("ID de pedido requerido");
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error("ID de pedido inválido");
    }

    // Validaciones de los campos a actualizar
    if (pedido.cantidad !== undefined) {
      if (typeof pedido.cantidad !== "number" || pedido.cantidad <= 0) {
        throw new Error("La cantidad debe ser un número mayor a 0");
      }
    }

    if (pedido.ubicacion !== undefined) {
      if (
        typeof pedido.ubicacion !== "string" ||
        pedido.ubicacion.trim().length === 0
      ) {
        throw new Error("La ubicación debe ser una cadena no vacía");
      }
      pedido.ubicacion = pedido.ubicacion.trim();
    }

    if (pedido.observaciones !== undefined && pedido.observaciones !== null) {
      if (typeof pedido.observaciones !== "string") {
        throw new Error("Las observaciones deben ser una cadena");
      }
      pedido.observaciones = pedido.observaciones.trim() || undefined;
    }

    // Validación de IDs si se proporcionan
    if (pedido.idProducto && !uuidRegex.test(pedido.idProducto)) {
      throw new Error("ID de producto inválido");
    }

    if (pedido.idCliente && !uuidRegex.test(pedido.idCliente)) {
      throw new Error("ID de cliente inválido");
    }

    if (pedido.idVendedor && !uuidRegex.test(pedido.idVendedor)) {
      throw new Error("ID de vendedor inválido");
    }

    // Validación de estado si se proporciona
    const estadosValidos = [
      "pendiente",
      "confirmado",
      "en_proceso",
      "enviado",
      "entregado",
      "cancelado",
    ];
    if (pedido.estado && !estadosValidos.includes(pedido.estado)) {
      throw new Error(
        `Estado inválido. Estados válidos: ${estadosValidos.join(", ")}`,
      );
    }

    try {
      // Verificar existencia de entidades relacionadas si se están actualizando
      if (pedido.idProducto) {
        const producto = await this.productoModelDB.getById({
          id: pedido.idProducto,
          context,
        });
        if (!producto) {
          throw new Error("Producto no encontrado");
        }
      }

      if (pedido.idCliente) {
        const cliente = await this.userModelDB.getById({
          id: pedido.idCliente,
          context,
        });
        if (!cliente) {
          throw new Error("Cliente no encontrado");
        }
      }

      if (pedido.idVendedor) {
        const vendedor = await this.userModelDB.getById({
          id: pedido.idVendedor,
          context,
        });
        if (!vendedor) {
          throw new Error("Vendedor no encontrado");
        }
      }

      return await this.servicePedido.updatePedido({ id, pedido, context });
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
    // Validación del ID
    if (!id || typeof id !== "string") {
      throw new Error("ID de pedido requerido");
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error("ID de pedido inválido");
    }

    try {
      return await this.servicePedido.deletePedido({ id, context });
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
    // Validación del ID
    if (!id || typeof id !== "string") {
      throw new Error("ID de pedido requerido");
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error("ID de pedido inválido");
    }

    // Validación del estado
    const estadosValidos = [
      "pendiente",
      "confirmado",
      "en_proceso",
      "enviado",
      "entregado",
      "cancelado",
    ];
    if (!estadosValidos.includes(nuevoEstado)) {
      throw new Error(
        `Estado inválido. Estados válidos: ${estadosValidos.join(", ")}`,
      );
    }

    try {
      return await this.servicePedido.cambiarEstadoPedido({
        id,
        nuevoEstado,
        context,
      });
    } catch (error) {
      console.error("Error al cambiar estado del pedido:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error inesperado al cambiar el estado del pedido");
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
    // Validación del vendedorId
    if (!vendedorId || typeof vendedorId !== "string") {
      throw new Error("ID de vendedor requerido");
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(vendedorId)) {
      throw new Error("ID de vendedor inválido");
    }

    // Validación de paginación
    if (page < 1) {
      throw new Error("La página debe ser mayor a 0");
    }

    if (limit < 1 || limit > 100) {
      throw new Error("El límite debe estar entre 1 y 100");
    }

    try {
      return await this.servicePedido.getPedidosPorVendedor({
        vendedorId,
        context,
        page,
        limit,
      });
    } catch (error) {
      console.error("Error al obtener pedidos por vendedor:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error inesperado al obtener los pedidos del vendedor");
    }
  }
}
