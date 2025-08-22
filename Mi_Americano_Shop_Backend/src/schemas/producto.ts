import { z } from "zod";

// Esquema base para producto completo
export const productoSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(2).max(100),
  descripcion: z.string().max(500),
  precio: z.number().min(0),
  stock: z.number().int().nonnegative(),
  talle: z.enum(["XS", "S", "M", "L", "XL", "XXL"]),
  marca: z.string().min(1),
  imagen: z.string().url(),
  userId: z.string(),
});

// Para crear productos (sin id, se genera automáticamente)
export const productoCreateSchema = productoSchema.omit({ id: true });

// Para actualizaciones parciales (PATCH)
export const productoPartialSchema = productoSchema.partial();

// Para updates completos donde id es requerido
export const productoUpdateSchema = productoSchema.partial().required({
  id: true,
});

// Si querés devolver un producto sin el campo userId (por ejemplo, en la API pública)
export const productoPublicSchema = productoSchema.omit({ userId: true });

export type Producto = z.infer<typeof productoSchema>;
export type ProductoCreate = z.infer<typeof productoCreateSchema>;
export type ProductoPartial = z.infer<typeof productoPartialSchema>;
export type ProductoUpdate = z.infer<typeof productoUpdateSchema>;
export type ProductoPublic = z.infer<typeof productoPublicSchema>;
