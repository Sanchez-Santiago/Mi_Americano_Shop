import { Pedido, PedidoPartial, PedidoCreate } from "../schemas/pedido.ts";
import { Producto, ProductoPartial } from "../schemas/producto.ts";
import { User,UserSecure } from "../schemas/user.ts";
import { ModelDB } from "../interface/model.ts";

export class ServicePedido {
  private userModel: ModelDB<User, UserSecure>;
  private pedidoModel: ModelDB<Pedido, PedidoPartial>;
  private productoModel: ModelDB<Producto, ProductoPartial>;

  constructor(
    private pedidoModelDB: ModelDB<Pedido, PedidoPartial>,
    private userModelDB: ModelDB<User, UserSecure>,
    private productoModelDB: ModelDB<Producto, ProductoPartial>
  ) {
    this.pedidoModel = pedidoModelDB;
    this.userModel = userModelDB;
    this.productoModel = productoModelDB;
  }

  async createPedido(input: { pedido: PedidoCreate}): Promise<boolean> {

    try {
      // Obtenemos el producto desde la base de datos
      const producto = await this.productoModel.getById({ id: input.pedido.idProducto });

      // Verificamos que el producto exista y tenga un stock válido
      if (!producto || typeof producto.stock !== "number") {
        throw new Error("Producto inválido o no encontrado");
      }

      // Verificamos si hay suficiente stock para realizar el pedido
      if (producto.stock < input.pedido.cantidad) {
        throw new Error("No hay suficiente stock");
      }

      // Agregamos el pedido a la base de datos
      const result = await this.pedidoModel.add({ input: input.pedido });

      if (result) {
        // Si el pedido se guardó correctamente, calculamos el nuevo stock
        const stokNew: number = producto.stock - input.pedido.cantidad;

        // Actualizamos el producto con el nuevo stock
        await this.productoModel.update({
          id: input.pedido.idProducto,
          input: {
            ...(producto as Producto), // Usamos type assertion para forzar el tipo completo requerido
            stock: stokNew,
          },
        });
      }

      // Devolvemos true si el pedido se creó con éxito
      return !!result;

    } catch (error) {
      // Manejamos errores inesperados y los lanzamos para ser tratados externamente
      console.error("Error al crear el pedido:", error);
      throw new Error("Error al crear el pedido");
    }
  }


  async getPedidoById({id}:{id:string}): Promise<Pedido | undefined> {
      const pedido = await this.pedidoModel.getById({id});
      return pedido as Pedido | undefined;
  }

  async updatePedido(id: string, pedido: PedidoPartial): Promise<Pedido | null> {
    return this.pedidoModel.update(id, pedido);
  }

  async deletePedido(id: string): Promise<boolean> {
    return this.pedidoModel.delete(id);
  }

  async getAllPedidos(): Promise<Pedido[]> {
    return this.pedidoModel.findAll();
  }
