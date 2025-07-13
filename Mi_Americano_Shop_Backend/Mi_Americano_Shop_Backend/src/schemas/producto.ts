import { z } from "zod";

const productoSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  descripcion: z.string(),
  precio: z.number().min(0),
  stock: z.number().int().nonnegative(),
  talle: z.string(),
  marca: z.string(),
  imagen: z.string().url(),
});

export const productoPartialSchema = productoSchema.partial();

export type Producto = z.infer<typeof productoSchema>;
export type ProductoPartial = z.infer<typeof productoPartialSchema>;
