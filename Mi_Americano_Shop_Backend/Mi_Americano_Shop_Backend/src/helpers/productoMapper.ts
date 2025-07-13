// helpers/productoMapper.ts ----------------------------------------------
import { Producto } from "../schemas/producto.ts";

/** Convierte una fila genérica de libsql en un Producto fuertemente tipado */
export const mapRowToProducto = (row: Record<string, unknown>): Producto => ({
  id: Number(row.id), // en la BD puede ser bigint | number
  nombre: row.nombre as string,
  descripcion: row.descripcion as string,
  precio: Number(row.precio),
  stock: Number(row.stock),
  talle: row.talle as string,
  marca: row.marca as string,
  imagen: row.imagen as string,
});
