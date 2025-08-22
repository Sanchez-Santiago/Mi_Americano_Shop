// model/ProductoSQLite.ts
import { sqlite } from "../db/sqlite.ts";
import { Producto, ProductoPartial } from "../schemas/producto.ts";
import { ModelDB } from "../interface/model.ts";

export class ProductoSQLite implements ModelDB<Producto> {
  connection = sqlite;

  async add({ input }: { input: Producto }): Promise<Producto> {
    try {
      const result = await sqlite.execute({
        sql: `INSERT INTO producto
          (id, nombre, precio, stock, imagen, descripcion, talle, marca, userId) VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          input.id,
          input.nombre,
          input.precio,
          input.stock,
          input.imagen,
          input.descripcion,
          input.talle,
          input.marca,
          input.userId,
        ],
      });
      if (!result) {
        throw new Error("No se pudo crear el producto, error DB");
      }

      return {
        id: input.id,
        nombre: input.nombre,
        precio: input.precio,
        stock: input.stock,
        imagen: input.imagen,
        descripcion: input.descripcion,
        talle: input.talle,
        marca: input.marca,
        userId: input.userId,
      };
    } catch (error) {
      console.error("Error al crear producto:", error);
      throw new Error("No se pudo crear el producto");
    }
  }

  async update(
    { id, input }: { id: string; input: ProductoPartial },
  ): Promise<Producto> {
    try {
      const productoOld = await this.getById({ id });
      if (!productoOld) throw new Error("Producto no encontrado");

      await sqlite.execute({
        sql: `UPDATE producto
          SET nombre = ?, precio = ?, stock = ?,
          imagen = ?, descripcion = ?, talle = ?, marca = ?, userId = ? WHERE id = ?`,
        args: [
          input.nombre ?? productoOld.nombre,
          input.precio ?? productoOld.precio,
          input.stock ?? productoOld.stock,
          input.imagen ?? productoOld.imagen,
          input.descripcion ?? productoOld.descripcion,
          input.talle ?? productoOld.talle,
          input.marca ?? productoOld.marca,
          input.userId ?? productoOld.userId,
          id,
        ],
      });

      return {
        id: id,
        nombre: input.nombre ?? productoOld.nombre,
        precio: input.precio ?? productoOld.precio,
        stock: input.stock ?? productoOld.stock,
        imagen: input.imagen ?? productoOld.imagen,
        descripcion: input.descripcion ?? productoOld.descripcion,
        talle: input.talle ?? productoOld.talle,
        marca: input.marca ?? productoOld.marca,
        userId: input.userId ?? productoOld.userId,
      };
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      throw new Error("No se pudo actualizar el producto");
    }
  }

  async delete({ id }: { id: string }): Promise<boolean> {
    try {
      const result = await sqlite.execute({
        sql: `DELETE FROM producto WHERE id = ?`,
        args: [id],
      });

      return result.rowsAffected > 0;
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      throw new Error("No se pudo eliminar el producto");
    }
  }

  async getById({ id }: { id: string }): Promise<Producto | undefined> {
    try {
      const result = await sqlite.execute({
        sql: `SELECT * FROM producto WHERE id = ?`,
        args: [id],
      });

      const row = result.rows?.[0];
      return row
        ? {
          id: String(row.id),
          nombre: String(row.nombre),
          precio: Number(row.precio),
          stock: Number(row.stock),
          imagen: String(row.imagen),
          descripcion: String(row.descripcion),
          talle: (["XS", "S", "M", "L", "XL", "XXL"].includes(String(row.talle))
            ? String(row.talle)
            : "S") as "XS" | "S" | "M" | "L" | "XL" | "XXL",
          marca: String(row.marca),
          userId: String(row.userId),
        }
        : undefined;
    } catch (error) {
      console.error("Error al obtener producto por ID:", error);
      throw new Error("No se pudo obtener el producto");
    }
  }

  async getAll(
    {
      name,
      precio,
      talle,
      vendedor,
      page = 1,
      limit = 10,
    }: {
      name?: string;
      precio?: number;
      talle?: string;
      vendedor?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<Producto[] | undefined> {
    try {
      const conditions: string[] = [];
      const args = [];

      if (name) {
        conditions.push("nombre LIKE ?");
        args.push(`%${name}%`);
      }
      if (precio !== undefined) {
        conditions.push("precio = ?");
        args.push(precio);
      }
      if (talle) {
        conditions.push("talle = ?");
        args.push(talle);
      }
      if (vendedor) {
        conditions.push("userId = ?");
        args.push(vendedor);
      }

      const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const offset = (page - 1) * limit;
      const sql = `
        SELECT * FROM producto
        ${whereClause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `;

      args.push(limit, offset);

      const result = await sqlite.execute({ sql, args });

      if (!result.rows?.length) return undefined;

      return result.rows.map((row) => ({
        id: String(row.id),
        nombre: String(row.nombre),
        precio: Number(row.precio),
        stock: Number(row.stock),
        imagen: String(row.imagen),
        descripcion: String(row.descripcion),
        talle: (row.talle as "XS" | "S" | "M" | "L" | "XL" | "XXL") ?? "S",
        marca: String(row.marca),
        userId: String(row.userId),
      }));
    } catch (error) {
      console.error("Error al obtener productos:", error);
      throw new Error("No se pudieron obtener los productos");
    }
  }
}
