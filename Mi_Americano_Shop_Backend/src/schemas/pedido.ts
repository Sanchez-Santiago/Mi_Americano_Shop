import { z } from "zod";

const pedidoSchema = z.object({
  id: z.string().uuid(),
  idProducto: z.string().uuid(),
  idVendedor: z.string().uuid(),
  idCliente: z.string().uuid(),
  cantidad: z.number().min(1),
  estado: z.enum(["pendiente", "en_proceso", "entregado", "cancelado"]),
  ubicacion: z.string().min(5).max(100),
  fechaCreacion: z.date(),
  fechaEntrega: z.date().optional(),
  observaciones: z.string().optional(),
});

export const pedidoPartial = pedidoSchema.partial();
export const pedidoCreate = pedidoSchema.omit({ fechaEntrega: true });

export type Pedido = z.infer<typeof pedidoSchema>;
export type PedidoPartial = z.infer<typeof pedidoPartial>;
export type PedidoCreate = z.infer<typeof pedidoCreate>;
