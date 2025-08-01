import { Pedido, PedidoPartial, PedidoCreate } from "../schemas/pedido.ts";
import { Producto, ProductoPartial } from "../schemas/producto.ts";
import { User, UserSecure } from "../schemas/user.ts";

import {ServicePedido} from "../services/servicePedido.ts";

import { ModelDB } from "../interface/model.ts";

export class ControllerPedido {
  private pedidoModel: ModelDB<Pedido, PedidoPartial>;
  private productoModel: ModelDB<Producto, ProductoPartial>;
  private userModel: ModelDB<User, UserSecure>;
  private servicePedido: ServicePedido;

  constructor(
    private pedidoModelDB: ModelDB<Pedido, PedidoPartial>,
    private userModelDB: ModelDB<User, UserSecure>,
    private productoModelDB: ModelDB<Producto, ProductoPartial>
  ) {
    this.pedidoModel = pedidoModelDB;
    this.productoModel = productoModelDB;
    this.userModel = userModelDB;
    this.servicePedido = new ServicePedido(this.pedidoModel, this.userModel, this.productoModel);
  }

  async createPedido(pedido: PedidoPartial): Promise<boolean> {
    // Verificamos que todos los campos obligatorios estén presentes en el pedido
    if (
      !pedido.idCliente ||
      !pedido.idProducto ||
      !pedido.idVendedor ||
      !pedido.cantidad ||
      !pedido.ubicacion
    ) {
      throw new Error("Faltan campos obligatorios en el pedido");
    }

    try {
      const producto = await this.productoModel.getById({id:pedido.idProducto});
      if (!producto) {
        throw new Error("Producto no encontrado");
      }
      // Obtenemos los datos del usuario que realiza el pedido
      const user = await this.userModel.getById({ id: pedido.idCliente });
      const userVendedor = await this.userModel.getById({ id: pedido.idVendedor });

      // Verificamos que el usuario exista y tenga un teléfono válido
      if (!user || typeof user.tel !== "string" || !userVendedor || typeof userVendedor.tel !== "string") {
        throw new Error("Usuario inválido o no encontrado");
      }

      const pedidoCompleto: PedidoCreate = {
        id: crypto.randomUUID(),
        idCliente: String(pedido.idCliente),
        idProducto: String(pedido.idProducto),
        idVendedor: String(pedido.idVendedor),
        cantidad: Number(pedido.cantidad),
        ubicacion: String(pedido.ubicacion),
        estado: "pendiente",
        fechaCreacion: new Date(),
        observaciones: pedido.observaciones // si aplica
      };

      const result = await this.servicePedido.createPedido({ pedido: pedidoCompleto });
      return !!result;

    } catch (error) {
      console.error("Error al crear el pedido:", error);
      throw new Error("Error al crear el pedido");
    }
  }

  async getPedidoById(id: string): Promise<Pedido | undefined> {
    if (!id && id.length >= 36) {
      throw new Error("ID de pedido inválido");
    }
    const pedido = await this.servicePedido.getPedidoById({id});
    if (!pedido) {
      return undefined;
    }else{
      return pedido;
    }
  }

  async updatePedido(id: string, pedido: PedidoPartial): Promise<Pedido | null> {
    const pedidoOriginal = await this.pedidoModel.getById({id});
    const pedidoActualizado = {
      ...pedidoOriginal,
      ...pedido,
      fechaActualizacion: new Date()
    };
    const pedidoUpdate = await this.pedidoModel.update({ id: id, input: pedidoActualizado });
    return pedidoUpdate;
  }

  async deletePedido(id: string): Promise<boolean> {
    return this.pedidoModel.delete(id);
  }

  async getAllPedidos(): Promise<Pedido[]> {
    return this.pedidoModel.findAll();
  }
