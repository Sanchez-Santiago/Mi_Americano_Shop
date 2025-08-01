import { ModelDB } from "../interface/model.ts";
import { Pedido, PedidoPartial } from "../schemas/pedido.ts";
import { sqlite } from "../db/sqlite.ts";

export class PedidoSQLite implements ModelDB<Pedido> {
  connection = sqlite;

  /**
   * Agrega un nuevo pedido a la base de datos.
   */
  async add({ input }: { input: Pedido }): Promise<Pedido> {
    try {
      const result = await sqlite.execute({
        sql: `
          INSERT INTO pedido (
            id, idCliente, idProducto, cantidad,
            fechaCreacion, estado
          ) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          input.id ?? "",
          input.idCliente ?? "",
          input.idProducto ?? "",
          input.cantidad ?? 0,
          input.fechaCreacion ?? new Date().toISOString(),
          input.estado ?? "pendiente",
        ],
      });

      if (!result) {
        throw new Error("No se pudo crear el pedido");
      }

      return {
        id: String(input.id),
        idProducto: String(input.idProducto),
        idCliente: String(input.idCliente),
        idVendedor: String(input.idVendedor),
        cantidad: Number(input.cantidad),
        ubicacion: String(input.ubicacion),
        fechaCreacion: new Date(input.fechaCreacion),
        estado: ["pendiente", "en_proceso", "entregado", "cancelado"].includes(
            String(input.estado),
          )
          ? String(input.estado) as Pedido["estado"]
          : "pendiente",
        observaciones: String(input.observaciones),
      };
    } catch (error) {
      console.error("Error al crear pedido:", error);
      throw new Error("No se pudo crear el pedido");
    }
  }

  /**
   * Obtiene un pedido por su ID.
   */
  async getById({ id }: { id: string }): Promise<Pedido | undefined> {
    try {
      const result = await sqlite.execute({
        sql: `SELECT * FROM pedido WHERE id = ?`,
        args: [Number(id)],
      });

      const row = result.rows?.[0];

      // Verifica que row existe y tiene los campos requeridos
      if (!row) {
        return undefined;
      }

      // Asegúrate de que los campos requeridos no sean undefined
      if (
        !row.id || !row.idProducto || !row.idVendedor || !row.idCliente ||
        row.cantidad == null || !row.estado || !row.ubicacion ||
        !row.fechaCreacion
      ) {
        console.error("Datos incompletos en la base de datos:", row);
        return undefined;
      }

      return {
        id: String(row.id),
        idProducto: String(row.idProducto),
        idCliente: String(row.idCliente),
        idVendedor: String(row.idVendedor),
        cantidad: Number(row.cantidad),
        ubicacion: String(row.ubicacion),
        fechaCreacion: new Date(String(row.fechaCreacion)),
        fechaEntrega: row.fechaEntrega
          ? new Date(String(row.fechaEntrega))
          : undefined,
        estado: ["pendiente", "en_proceso", "entregado", "cancelado"].includes(
            String(row.estado),
          )
          ? String(row.estado) as Pedido["estado"]
          : "pendiente",
        observaciones: row.observaciones
          ? String(row.observaciones)
          : undefined,
      };
    } catch (error) {
      console.error("Error al obtener pedido por ID:", error);
      throw new Error("No se pudo obtener el pedido");
    }
  }

  /**
   * Obtiene todos los pedidos, con paginación opcional.
   */
  async getAll(
    { page = 1, limit = 10 }: { page?: number; limit?: number } = {},
  ): Promise<Pedido[] | null> {
    try {
      const offset = (page - 1) * limit;
      const result = await sqlite.execute({
        sql: `SELECT * FROM pedido ORDER BY id DESC LIMIT ? OFFSET ?`,
        args: [limit, offset],
      });

      if (!result.rows?.length) return null;

      return result.rows.map((row) => ({
        id: String(row.id),
        idProducto: String(row.idProducto),
        idCliente: String(row.idCliente),
        idVendedor: String(row.idVendedor),
        cantidad: Number(row.cantidad),
        ubicacion: String(row.ubicacion),
        fechaCreacion: new Date(String(row.fechaCreacion)),
        fechaEntrega: new Date(String(row.fechaEntrega)),
        estado: ["pendiente", "en_proceso", "entregado", "cancelado"].includes(
            String(row.estado),
          )
          ? String(row.estado) as Pedido["estado"]
          : "pendiente",
        observaciones: row.observaciones
          ? String(row.observaciones)
          : undefined,
      }));
    } catch (error) {
      console.error("Error al obtener todos los pedidos:", error);
      throw new Error("No se pudieron obtener los pedidos");
    }
  }

  /**
   * Actualiza un pedido existente por su ID.
   */
  async update(
    { id, input }: { id: string; input: PedidoPartial },
  ): Promise<Pedido | undefined> {
    try {
      const currentPedido = await this.getById({ id });
      if (!currentPedido) {
        throw new Error("Pedido no encontrado");
      }

      await sqlite.execute({
        sql: `UPDATE pedido
              SET observaciones = ?, ubicacion = ?, cantidad = ?, estado = ?, fechaEntrega = ?
              WHERE id = ?`,
        args: [
          String(input.observaciones ?? currentPedido.observaciones),
          String(input.ubicacion ?? currentPedido.ubicacion),
          Number(input.cantidad ?? currentPedido.cantidad),
          String(input.estado ?? currentPedido.estado),
          String(input.fechaEntrega ?? currentPedido.fechaEntrega),
          String(id),
        ],
      });

      return {
        ...currentPedido,
        ...input,
        fechaCreacion: currentPedido.fechaCreacion, // No se actualiza
        fechaEntrega: input.fechaEntrega
          ? new Date(String(input.fechaEntrega))
          : currentPedido.fechaEntrega,
        estado: ["pendiente", "en_proceso", "entregado", "cancelado"].includes(
            String(input.estado),
          )
          ? String(input.estado) as Pedido["estado"]
          : currentPedido.estado,
      };
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      throw new Error("No se pudo actualizar el pedido");
    }
  }

  /**
   * Elimina un pedido por su ID.
   */
  async delete({ id }: { id: string }): Promise<boolean> {
    try {
      const result = await sqlite.execute({
        sql: `DELETE FROM pedido WHERE id = ?`,
        args: [Number(id)],
      });

      return result.rowsAffected > 0;
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      throw new Error("No se pudo eliminar el pedido");
    }
  }
}
