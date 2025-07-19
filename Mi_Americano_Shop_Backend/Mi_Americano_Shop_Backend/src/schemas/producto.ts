import { z } from "zod";

export const productoSchema = z.object({
  id: z.number(),
  nombre: z.string().min(2).max(100),
  descripcion: z.string().max(500),
  precio: z.number().min(0),
  stock: z.number().int().nonnegative(),
  talle: z.enum(["XS", "S", "M", "L", "XL", "XXL"]).optional(),
  marca: z.string().min(1),
  imagen: z.string().url(),
  userId: z.string().uuid(),
});

// Para actualizaciones parciales (PATCH)
export const productoPartialSchema = productoSchema.partial();

// Si querés devolver un producto sin el campo userId (por ejemplo, en la API pública)
export const productoPublicSchema = productoSchema.omit({ userId: true });

export type Producto = z.infer<typeof productoSchema>;
export type ProductoPartial = z.infer<typeof productoPartialSchema>;
export type ProductoPublic = z.infer<typeof productoPublicSchema>;
