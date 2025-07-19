// db/productoModel.ts -----------------------------------------------------
import { sqlite } from "../db/sqlite.ts";
import { Producto, ProductoPartial } from "../schemas/producto.ts";
import { ModelDB } from "../interface/model.ts";

export class ProductoSQLite implements ModelDB<Producto> {
  connection = sqlite;

  async add({ input }: { input: ProductoPartial }): Promise<Producto> {
    try {
      const result = await sqlite.execute({
        sql:
          `INSERT INTO producto (nombre, precio, stock, imagen, descripcion, talle, marca, user)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
        id: Number(result.lastInsertRowid),
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
              SET nombre = ?, precio = ?, stock = ?, imagen = ?, descripcion = ?, talle = ?, marca = ?, user = ?
              WHERE id = ?`,
        args: [
          input.nombre ?? currentProduct.nombre,
          input.precio ?? currentProduct.precio,
          input.stock ?? currentProduct.stock,
          input.imagen ?? currentProduct.imagen,
          input.descripcion ?? currentProduct.descripcion,
          input.talle ?? currentProduct.talle ?? "XS",
          input.marca ?? currentProduct.marca,
          Number(id),
        ],
      });

      return {
        id: Number(id),
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
          id: Number(row.id),
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
    { page = 1, limit = 10 }: { page?: number; limit?: number } = {},
  ): Promise<Producto[] | null> {
    try {
      const offset = (page - 1) * limit;
      const result = await sqlite.execute({
        sql: `SELECT * FROM producto ORDER BY id DESC LIMIT ? OFFSET ?`,
        args: [limit, offset],
      });

      if (!result.rows?.length) return null;

      return result.rows.map((row) => ({
        id: Number(row.id),
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
      console.error("Error al obtener todos los productos:", error);
      throw new Error("No se pudieron obtener los productos");
    }
  }

  async getName({ name, page = 1, limit = 10 }: {
    name: string;
    page?: number;
    limit?: number;
  }): Promise<Producto[] | null> {
    try {
      const offset = (page - 1) * limit;
      const result = await sqlite.execute({
        sql: `SELECT * FROM producto
              WHERE lower(nombre) LIKE lower(?)
              ORDER BY id DESC
              LIMIT ? OFFSET ?`,
        args: [`%${name}%`, limit, offset],
      });

      if (!result.rows?.length) return null;

      return result.rows.map((row) => ({
        id: Number(row.id),
        nombre: String(row.nombre),
        precio: Number(row.precio),
        stock: Number(row.stock),
        imagen: String(row.imagen),
        descripcion: String(row.descripcion),
        talle: (row.talle as "XS" | "S" | "M" | "L" | "XL" | "XXL") ?? "S",
        marca: String(row.marca),
        user: String(row.user),
      }));
    } catch (error) {
      console.error("Error al buscar productos por nombre:", error);
      throw new Error("No se pudieron buscar los productos");
    }
  }
}
