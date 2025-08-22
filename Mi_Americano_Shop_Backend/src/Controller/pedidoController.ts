import { Pedido, PedidoCreate, PedidoPartial } from "../schemas/pedido.ts";
import { Producto } from "../schemas/producto.ts";
import { User } from "../schemas/user.ts";
import { PedidoService } from "../services/servicePedido.ts";
import { ModelDB } from "../interface/model.ts";
import { AuthContext } from "../types/AuthContext.ts";

export class ControllerPedido {
  private servicePedido: PedidoService;

  constructor(
    private pedidoModelDB: ModelDB<Pedido>,
    private userModelDB: ModelDB<User>,
    private productoModelDB: ModelDB<Producto>,
  ) {
    // Inyectamos dependencias en el servicio
    this.servicePedido = new PedidoService(
      this.pedidoModelDB,
      this.productoModelDB,
      this.userModelDB, // PedidoService espera producto y user
    );
  }

  /** --- Funciones utilitarias de validación --- */
  private validateUUID(id: string, name: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error(`ID inválido para ${name}`);
    }
  }

  private validateCantidad(cantidad: number) {
    if (typeof cantidad !== "number" || cantidad <= 0) {
      throw new Error("La cantidad debe ser un número mayor a 0");
    }
  }

  private validateUbicacion(ubicacion: string) {
    if (typeof ubicacion !== "string" || ubicacion.trim().length === 0) {
      throw new Error("La ubicación debe ser una cadena no vacía");
    }
    return ubicacion.trim();
  }

  private validateEstado(estado: Pedido["estado"]) {
    const estadosValidos = [
      "pendiente",
      "confirmado",
      "en_proceso",
      "enviado",
      "entregado",
      "cancelado",
    ];
    if (!estadosValidos.includes(estado)) {
      throw new Error(
        `Estado inválido. Estados válidos: ${estadosValidos.join(", ")}`,
      );
    }
  }

  /** --- Métodos públicos del Controller --- */

  /**
   * Crear un nuevo pedido
   * - Valida campos requeridos
   * - Verifica existencia de cliente, vendedor y producto
   * - Crea el pedido con estado inicial "pendiente"
   */
  async createPedido({
    pedido,
    context,
  }: {
    pedido: PedidoPartial;
    context: AuthContext;
  }): Promise<Pedido> {
    if (
      !pedido.idCliente || !pedido.idProducto || !pedido.idVendedor ||
      !pedido.cantidad || !pedido.ubicacion
    ) {
      throw new Error(
        "Faltan campos obligatorios: idCliente, idProducto, idVendedor, cantidad, ubicacion",
      );
    }

    // Validaciones de tipos y formatos
    this.validateUUID(pedido.idCliente, "cliente");
    this.validateUUID(pedido.idProducto, "producto");
    this.validateUUID(pedido.idVendedor, "vendedor");
    this.validateCantidad(pedido.cantidad);
    const ubicacion = this.validateUbicacion(pedido.ubicacion);

    try {
      // Verificar que existan entidades relacionadas
      const [producto, cliente, vendedor] = await Promise.all([
        this.productoModelDB.getById({ id: pedido.idProducto }),
        this.userModelDB.getById({ id: pedido.idCliente }),
        this.userModelDB.getById({ id: pedido.idVendedor }),
      ]);

      if (!producto) throw new Error("Producto no encontrado");
      if (!cliente) throw new Error("Cliente no encontrado");
      if (!vendedor) throw new Error("Vendedor no encontrado");

      // Crear el objeto completo de Pedido
      const pedidoCompleto: PedidoCreate = {
        id: crypto.randomUUID(),
        idCliente: pedido.idCliente,
        idProducto: pedido.idProducto,
        idVendedor: pedido.idVendedor,
        cantidad: pedido.cantidad,
        ubicacion,
        estado: "pendiente",
        fechaCreacion: new Date(),
        observaciones: pedido.observaciones?.trim() || undefined,
      };

      return await this.servicePedido.create({
        input: pedidoCompleto,
        context,
      });
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      if (error instanceof Error) throw error;
      throw new Error("Error inesperado al crear el pedido");
    }
  }

  /**
   * Obtener un pedido por ID
   */
  async getPedidoById(
    { id, context }: { id: string; context: AuthContext },
  ): Promise<Pedido | undefined> {
    this.validateUUID(id, "pedido");
    return await this.servicePedido.getById(context, id);
  }

  /**
   * Listar pedidos
   * - Si es admin, ve todos
   * - Si es vendedor/cliente, solo los propios
   */
  async getAllPedidos({
    context,
    page = 1,
    limit = 20,
  }: {
    context: AuthContext;
    page?: number;
    limit?: number;
  }): Promise<Pedido[]> {
    if (page < 1) throw new Error("La página debe ser mayor a 0");
    if (limit < 1 || limit > 100) {
      throw new Error("El límite debe estar entre 1 y 100");
    }

    // Forzamos array vacío si el service retorna undefined
    return (await this.servicePedido.getAll(context, page, limit)) ?? [];
  }

  /**
   * Actualizar un pedido por ID
   */
  async updatePedido({
    id,
    pedido,
    context,
  }: {
    id: string;
    pedido: Partial<Pedido>;
    context: AuthContext;
  }): Promise<Pedido | undefined> {
    this.validateUUID(id, "pedido");

    if (pedido.cantidad !== undefined) this.validateCantidad(pedido.cantidad);
    if (pedido.ubicacion !== undefined) {
      pedido.ubicacion = this.validateUbicacion(pedido.ubicacion);
    }
    if (pedido.estado !== undefined) this.validateEstado(pedido.estado);

    if (pedido.idProducto) this.validateUUID(pedido.idProducto, "producto");
    if (pedido.idCliente) this.validateUUID(pedido.idCliente, "cliente");
    if (pedido.idVendedor) this.validateUUID(pedido.idVendedor, "vendedor");

    return await this.servicePedido.update(context, id, pedido);
  }

  /**
   * Eliminar un pedido por ID
   */
  async deletePedido(
    { id, context }: { id: string; context: AuthContext },
  ): Promise<boolean> {
    this.validateUUID(id, "pedido");
    return await this.servicePedido.delete(context, id);
  }
}
