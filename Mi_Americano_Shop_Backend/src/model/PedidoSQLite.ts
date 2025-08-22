import { ModelDB } from "../interface/model.ts";
import { Pedido } from "../schemas/pedido.ts";
import { sqlite } from "../db/sqlite.ts";

interface SQLiteRow {
  id: string | number;
  idProducto: string | number;
  idCliente: string | number;
  idVendedor: string | number;
  cantidad: string | number;
  ubicacion: string;
  fechaCreacion: string;
  fechaEntrega?: string | null;
  estado: string;
  observaciones?: string | null;
}

/**
 * Convierte una fila cruda de SQLite en un objeto Pedido tipado.
 */
function mapRowToPedido(row: SQLiteRow): Pedido {
  return {
    id: String(row.id),
    idProducto: String(row.idProducto),
    idCliente: String(row.idCliente),
    idVendedor: String(row.idVendedor),
    cantidad: Number(row.cantidad),
    ubicacion: row.ubicacion,
    fechaCreacion: new Date(row.fechaCreacion),
    fechaEntrega: row.fechaEntrega ? new Date(row.fechaEntrega) : undefined,
    estado: row.estado as Pedido["estado"],
    observaciones: row.observaciones ?? undefined,
  };
}

export class PedidoSQLite implements ModelDB<Pedido, Pedido> {
  connection = sqlite;

  /**
   * Inserta un nuevo pedido en la base de datos.
   */
  async add({ input }: { input: Pedido }): Promise<Pedido> {
    try {
      await sqlite.execute({
        sql: `
          INSERT INTO pedido (
            id, idProducto, idVendedor, idCliente, cantidad, ubicacion, fechaCreacion, estado, observaciones
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          input.id,
          input.idProducto,
          input.idVendedor,
          input.idCliente,
          input.cantidad,
          input.ubicacion,
          input.fechaCreacion.toISOString(),
          input.estado,
          input.observaciones ?? "",
        ],
      });
      return mapRowToPedido(input as unknown as SQLiteRow);
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
      const sql = `SELECT * FROM pedido WHERE id = ?`;
      const args = [id];
      const result = await sqlite.execute({ sql, args });

      const row = result.rows?.[0] as unknown as SQLiteRow | undefined;
      return row ? mapRowToPedido(row) : undefined;
    } catch (error) {
      console.error("Error al obtener pedido por ID:", error);
      throw new Error("No se pudo obtener el pedido");
    }
  }

  /**
   * Lista pedidos con paginación y filtros opcionales.
   * ⚠️ Este método devuelve datos sin filtrar por permisos.
   * El filtrado por rol/contexto se hace en el Service.
   */
  async getAll({
    page = 1,
    limit = 20,
    name,
    email,
    precio,
    talle,
    vendedorId,
  }: {
    page?: number;
    limit?: number;
    name?: string;
    email?: string;
    precio?: number;
    talle?: string;
    vendedorId?: string;
  }): Promise<Pedido[] | undefined> {
    try {
      const offset = Math.max(0, page - 1) * limit;
      const filters: string[] = [];
      const args: (string | number)[] = [];

      if (vendedorId) {
        filters.push("idVendedor = ?");
        args.push(vendedorId);
      }
      if (name) {
        filters.push("name LIKE ?");
        args.push(`%${name}%`);
      }
      if (email) {
        filters.push("email = ?");
        args.push(email);
      }
      if (typeof precio !== "undefined") {
        filters.push("precio = ?");
        args.push(precio);
      }
      if (talle) {
        filters.push("talle = ?");
        args.push(talle);
      }

      const whereClause = filters.length
        ? `WHERE ${filters.join(" AND ")}`
        : "";
      const sql = `
         SELECT * FROM pedido
         ${whereClause}
         ORDER BY id DESC
         LIMIT ? OFFSET ?
       `;
      args.push(limit, offset);

      const result = await sqlite.execute({ sql, args });
      if (!result.rows?.length) return undefined; // ✅ ya no null

      return result.rows.map(
        (row) => mapRowToPedido(row as unknown as SQLiteRow), // ✅ cast correcto
      );
    } catch (error) {
      console.error("Error al obtener todos los pedidos:", error);
      throw new Error("No se pudieron obtener los pedidos");
    }
  }

  /**
   * Actualiza un pedido existente.
   */
  async update({
    id,
    input,
  }: {
    id: string;
    input: Partial<Pedido>;
  }): Promise<Pedido | undefined> {
    try {
      const existing = await this.getById({ id });
      if (!existing) throw new Error("Pedido no encontrado");

      const updated: Pedido = {
        ...existing,
        ...input,
        fechaEntrega: input.fechaEntrega
          ? new Date(String(input.fechaEntrega))
          : existing.fechaEntrega,
      };

      await sqlite.execute({
        sql: `UPDATE pedido
              SET observaciones = ?, ubicacion = ?, cantidad = ?, estado = ?, fechaEntrega = ?
              WHERE id = ?`,
        args: [
          updated.observaciones ?? "",
          updated.ubicacion,
          updated.cantidad,
          updated.estado,
          updated.fechaEntrega ? updated.fechaEntrega.toISOString() : null,
          id,
        ],
      });

      return updated;
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      throw new Error("No se pudo actualizar el pedido");
    }
  }

  /**
   * Elimina un pedido de la base de datos.
   */
  async delete({ id }: { id: string }): Promise<boolean> {
    try {
      const sql = `DELETE FROM pedido WHERE id = ?`;
      const args = [id];
      const result = await sqlite.execute({ sql, args });

      return result.rowsAffected > 0;
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      throw new Error("No se pudo eliminar el pedido");
    }
  }
}
