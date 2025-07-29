// db/productoModel.ts -----------------------------------------------------
import { sqlite } from "../db/sqlite.ts";
import { Producto, ProductoPartial } from "../schemas/producto.ts";
import { ModelDB } from "../interface/model.ts";

export class ProductoSQLite implements ModelDB<Producto> {
  connection = sqlite;

  async add({ input }: { input: ProductoPartial }): Promise<Producto> {
    try {
      const result = await sqlite.execute({
        sql: `INSERT INTO producto
          (nombre, precio, stock, imagen, descripcion, talle, marca, userId) VALUES
          (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          input.nombre ?? "",
          input.precio ?? 0,
          input.stock ?? 0,
          input.imagen ?? "",
          input.descripcion ?? "",
          input.talle ?? "",
          input.marca ?? "",
          input.userId ?? "",
        ],
      });

      return {
        id: String(result.lastInsertRowid),
        nombre: input.nombre ?? "",
        precio: input.precio ?? 0,
        stock: input.stock ?? 0,
        imagen: input.imagen ?? "",
        descripcion: input.descripcion ?? "",
        talle: input.talle ?? "",
        marca: input.marca ?? "",
        userId: input.userId ?? "",
      } as Producto;
    } catch (error) {
      console.error("Error al crear producto:", error);
      throw new Error("No se pudo crear el producto");
    }
  }

  async update(
    { id, input }: { id: string; input: Partial<Producto> },
  ): Promise<Producto> {
    try {
      // Primero obtenemos el producto actual para mantener valores existentes
      const currentProduct = await this.getById({ id });
      if (!currentProduct) {
        throw new Error("Producto no encontrado");
      }

      await sqlite.execute({
        sql: `UPDATE producto
          SET nombre = ?, precio = ?, stock = ?,
          imagen = ?, descripcion = ?, talle = ?, marca = ?, userId = ? WHERE id = ?`,
        args: [
          input.nombre ?? "",
          input.precio ?? 0,
          input.stock ?? 0,
          input.imagen ?? "",
          input.descripcion ?? "",
          input.talle ?? "",
          input.marca ?? "",
          input.userId ?? "",
          id,
        ],
      });

      return {
        id: String(id),
        nombre: input.nombre ?? currentProduct.nombre,
        precio: input.precio ?? currentProduct.precio,
        stock: input.stock ?? currentProduct.stock,
        imagen: input.imagen ?? currentProduct.imagen,
        descripcion: input.descripcion ?? currentProduct.descripcion,
        talle: input.talle ?? currentProduct.talle,
        marca: input.marca ?? currentProduct.marca,
        userId: input.userId ?? currentProduct.userId,
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
        args: [Number(id)],
      });

      // Verificar si se eliminó alguna fila
      return result.rowsAffected > 0;
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      throw new Error("No se pudo eliminar el producto");
    }
  }

  async getById({ id }: { id: string }): Promise<Producto | null> {
    try {
      const result = await sqlite.execute({
        sql: `SELECT * FROM producto WHERE id = ?`,
        args: [Number(id)],
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
            : "XS") as "XS" | "S" | "M" | "L" | "XL" | "XXL",
          marca: String(row.marca),
          userId: String(row.userId),
        }
        : null;
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
  ): Promise<Producto[] | null> {
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

      if (!result.rows?.length) return null;

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

  async getName(params: {
    name: string;
    page?: number;
    limit?: number;
  }): Promise<Producto[] | null> {
    try {
      const offset = (params.page ?? 1) * (params.limit ?? 10) - 1;
      const result = await sqlite.execute({
        sql: `SELECT * FROM producto
              WHERE lower(nombre) LIKE lower(?)
              ORDER BY id DESC
              LIMIT ? OFFSET ?`,
        args: [`%${name}%`, params.limit ?? 10, offset],
      });

      if (!result.rows?.length) return null;

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
      console.error("Error al buscar productos por nombre:", error);
      throw new Error("No se pudieron buscar los productos");
    }
  }
}
