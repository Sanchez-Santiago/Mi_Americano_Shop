// db/productoModel.ts -----------------------------------------------------
import { sqlite } from "../db/sqlite.ts";
import { Producto, ProductoPartial } from "../schemas/producto.ts";
import { mapRowToProducto } from "../helpers/productoMapper.ts";

export class ProductoSQLite {
  async createProducto({ input }: { input: ProductoPartial }) {
    try {
      const result = await sqlite.execute({
        sql: `INSERT INTO producto (nombre, precio, stock, imagen, descripcion, talle, marca)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          input.nombre ?? "",
          input.precio ?? 0,
          input.stock ?? 0,
          input.imagen ?? "",
          input.descripcion ?? "",
          input.talle ?? "",
          input.marca ?? "",
        ],
      });

      const id = Number(result.lastInsertRowid);
      return { id, message: "Producto creado" };
    } catch (error) {
      console.error("Error al crear producto:", error); // <--- clave
      throw new Error("No se pudo crear el producto");
    }
  }

  async updateProducto({ id, input }: { id: number; input: Producto }) {
    try {
      await sqlite.execute({
        sql: `UPDATE productos 
              SET nombre = ?, precio = ?, stock = ?, imagen = ?, descripcion = ?, talle = ?, marca = ?
              WHERE id = ?`,
        args: [
          input.nombre,
          input.precio,
          input.stock,
          input.imagen,
          input.descripcion,
          input.talle,
          input.marca,
          id,
        ],
      });
      return { message: "Producto actualizado correctamente" };
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      throw new Error("No se pudo actualizar el producto");
    }
  }

  async deleteProducto({ id }: { id: number }) {
    try {
      await sqlite.execute({
        sql: `DELETE FROM productos WHERE id = ?`,
        args: [id],
      });
      return { message: "Producto eliminado correctamente" };
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      throw new Error("No se pudo eliminar el producto");
    }
  }

  /** Devuelve un producto o null si no existe */
  async getProducto({ id }: { id: number }): Promise<Producto | null> {
    const result = await sqlite.execute({
      sql: `SELECT * FROM producto WHERE id = ?`,
      args: [id],
    });

    const row = result.rows[0]; // primer (y único) resultado
    return row ? mapRowToProducto(row) : null;
  }

  /** Devuelve todos los productos */
  async getProductoAll(): Promise<Producto[]> {
    const result = await sqlite.execute("SELECT * FROM producto");
    return result.rows.map(mapRowToProducto);
  }

  /** Búsqueda (LIKE) por nombre */
  async getProductoByName({ name }: { name: string }): Promise<Producto[]> {
    const result = await sqlite.execute({
      sql: `SELECT * FROM producto WHERE lower(nombre) LIKE lower(?)`,
      args: [`%${name}%`],
    });
    return result.rows.map(mapRowToProducto);
  }
}
