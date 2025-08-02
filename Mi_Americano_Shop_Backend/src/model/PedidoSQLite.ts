import { ModelDB } from "../interface/model.ts";
import { Pedido } from "../schemas/pedido.ts";
import { sqlite } from "../db/sqlite.ts";

type Role = "admin" | "vendedor" | string;

interface AuthContext {
  userId: string;
  role: Role;
}

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

function mapRowToPedido(row: SQLiteRow): Pedido {
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
    estado: String(row.estado) as Pedido["estado"],
    observaciones: row.observaciones ? String(row.observaciones) : undefined,
  };
}

export class PedidoSQLite implements ModelDB<Pedido, Pedido> {
  connection = sqlite;

  async add(
    { input }: { input: Pedido },
  ): Promise<Pedido> {
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

      return {
        ...input,
        fechaCreacion: new Date(String(input.fechaCreacion)),
        fechaEntrega: input.fechaEntrega
          ? new Date(String(input.fechaEntrega))
          : undefined,
      };
    } catch (error) {
      console.error("Error al crear pedido:", error);
      throw new Error("No se pudo crear el pedido");
    }
  }

  async getById({
    id,
    context,
  }: { id: string; context: AuthContext }): Promise<Pedido | undefined> {
    try {
      const baseSql = `SELECT * FROM pedido WHERE id = ?`;
      let sql: string;
      let args: (string | number)[];

      if (context.role === "admin") {
        sql = baseSql;
        args = [id];
      } else {
        sql = `${baseSql} AND idVendedor = ?`;
        args = [id, context.userId];
      }

      const result = await sqlite.execute({ sql, args });
      const row = result.rows?.[0] as unknown as SQLiteRow | undefined;
      if (!row) return undefined;
      return mapRowToPedido(row);
    } catch (error) {
      console.error("Error al obtener pedido por ID:", error);
      throw new Error("No se pudo obtener el pedido");
    }
  }

  async getAll({
    context,
    page = 1,
    limit = 20,
    name,
    email,
    precio,
    talle,
    vendedorId,
  }: {
    context: AuthContext;
    page?: number;
    limit?: number;
    name?: string;
    email?: string;
    precio?: number;
    talle?: string;
    vendedorId?: string;
  }): Promise<Pedido[] | null> {
    try {
      const offset = Math.max(0, page - 1) * limit;

      const ownerId = context.role === "admin" && vendedorId
        ? vendedorId
        : context.userId;

      const filters: string[] = [];
      const args: (string | number)[] = [];

      filters.push("idVendedor = ?");
      args.push(ownerId);

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
      if (!result.rows?.length) return null;
      return result.rows.map((row) =>
        mapRowToPedido(row as unknown as SQLiteRow)
      );
    } catch (error) {
      console.error("Error al obtener todos los pedidos:", error);
      throw new Error("No se pudieron obtener los pedidos");
    }
  }

  async update({
    id,
    context,
    input,
  }: {
    id: string;
    context: AuthContext;
    input: Partial<Pedido>;
  }): Promise<Pedido | undefined> {
    try {
      const existing = await this.getById({ id, context });
      if (!existing) {
        throw new Error("Pedido no encontrado o sin permisos");
      }

      const updated: Pedido = {
        ...existing,
        ...input,
        fechaCreacion: existing.fechaCreacion,
        fechaEntrega: input.fechaEntrega
          ? new Date(String(input.fechaEntrega))
          : existing.fechaEntrega,
        estado: input.estado
          ? String(input.estado) as Pedido["estado"]
          : existing.estado,
        observaciones: typeof input.observaciones !== "undefined"
          ? String(input.observaciones)
          : existing.observaciones,
      };

      const args: (string | number | null)[] = [
        updated.observaciones ?? "",
        updated.ubicacion,
        updated.cantidad,
        updated.estado,
        updated.fechaEntrega ? updated.fechaEntrega.toISOString() : null,
        id,
      ];

      if (context.role !== "admin") {
        args.push(context.userId);
      }

      await sqlite.execute({
        sql: `UPDATE pedido
              SET observaciones = ?, ubicacion = ?, cantidad = ?, estado = ?, fechaEntrega = ?
              WHERE id = ? ${
          context.role === "admin" ? "" : "AND idVendedor = ?"
        }`,
        args,
      });

      return updated;
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      throw new Error("No se pudo actualizar el pedido");
    }
  }

  async delete({
    id,
    context,
  }: {
    id: string;
    context: AuthContext;
  }): Promise<boolean> {
    try {
      if (context.role !== "admin") {
        const existing = await this.getById({ id, context });
        if (!existing) {
          throw new Error("Pedido no encontrado o sin permisos para eliminar");
        }
      }

      const sql = context.role === "admin"
        ? `DELETE FROM pedido WHERE id = ?`
        : `DELETE FROM pedido WHERE id = ? AND idVendedor = ?`;

      const args: (string | number)[] = context.role === "admin"
        ? [id]
        : [id, context.userId];

      const result = await sqlite.execute({ sql, args });

      return result.rowsAffected > 0;
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      throw new Error("No se pudo eliminar el pedido");
    }
  }
}
