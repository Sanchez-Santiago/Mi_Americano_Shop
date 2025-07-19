import { z } from "zod";

const pedidoSchema = z.object({
  idProducto: z.number(),
  idVendedor: z.string().uuid(),
  idCliente: z.string().uuid(),
  cantidad: z.number().min(1),
  estado: z.enum(["pendiente", "en_proceso", "entregado", "cancelado"]),
  ubicacion: z.string().min(5).max(100),
  fechaCreacion: z.date(),
  fechaEntrega: z.date(),
  observaciones: z.string().optional(),
});

export const pedidoPartial = pedidoSchema.partial();

export type Pedido = z.infer<typeof pedidoSchema>;
export type PedidoPartial = z.infer<typeof pedidoPartial>;
