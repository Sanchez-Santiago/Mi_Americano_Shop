import { ModelDB } from "../interface/model.ts";
import {
  Producto,
  ProductoPartial,
  productoPartialSchema,
} from "../schemas/producto.ts";

// Definir talles válidos como constante
const TALLES_VALIDOS = ["XS", "S", "M", "L", "XL", "XXL"] as const;
type TalleValido = typeof TALLES_VALIDOS[number];

export class ProductoController {
  private productoSQLite: ModelDB<Producto>;

  constructor(productoModel: ModelDB<Producto>) {
    this.productoSQLite = productoModel;
  }

  /**
   * Obtener todos los productos
   */
  async getAll(params: {
    name?: string;
    precio?: number;
    talle?: string;
    vendedor?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const productos = await this.productoSQLite.getAll(params);
      return productos;
    } catch (error) {
      console.error("Error en getAll:", error);
      throw new Error("Error al obtener los productos");
    }
  }

  /**
   * Obtener producto por ID
   */
  async getById({ id }: { id: string }) {
    // ✅ Corregir validación de ID
    if (!id || typeof id !== "string" || id.trim() === "") {
      throw new Error("ID inválido. Debe ser una cadena no vacía");
    }

    try {
      const producto = await this.productoSQLite.getById({ id });

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      return producto;
    } catch (error) {
      console.error("Error en getById:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error al obtener el producto");
    }
  }

  /**
   * Crear nuevo producto
   */
  async create({ data }: { data: ProductoPartial }) {
    try {
      const validatedData = productoPartialSchema.parse(data);
      this.validateProductoData(validatedData);
      const cleanedData = this.cleanProductoData(validatedData);

      const producto = await this.productoSQLite.add({
        input: cleanedData,
      });

      return {
        success: true,
        data: producto,
        message: "Producto creado exitosamente",
      };
    } catch (error) {
      console.error("Error en create:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error al crear el producto");
    }
  }

  /**
   * Actualizar producto existente
   */
  async update({ id, data }: { id: string; data: Partial<Producto> }) {
    if (!id || typeof id !== "string" || id.length === 0) {
      throw new Error("ID inválido. Debe ser una cadena no vacía");
    }

    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      throw new Error("Debe proporcionar al menos un campo para actualizar");
    }

    try {
      const productoExistente = await this.productoSQLite.getById({ id });
      if (!productoExistente) {
        throw new Error("Producto no encontrado");
      }

      this.validatePartialProductoData(data);
      const cleanedData = this.cleanPartialProductoData(data);

      const updatedProducto: Producto = {
        id: productoExistente.id,
        nombre: cleanedData.nombre ?? productoExistente.nombre,
        descripcion: cleanedData.descripcion ?? productoExistente.descripcion,
        precio: cleanedData.precio ?? productoExistente.precio,
        stock: cleanedData.stock ?? productoExistente.stock,
        talle: cleanedData.talle ?? productoExistente.talle,
        marca: cleanedData.marca ?? productoExistente.marca,
        imagen: cleanedData.imagen ?? productoExistente.imagen,
        userId: cleanedData.userId ?? productoExistente.userId,
      };

      const producto = await this.productoSQLite.update({
        id,
        input: updatedProducto,
      });

      return {
        success: true,
        data: producto,
        message: "Producto actualizado exitosamente",
      };
    } catch (error) {
      console.error("Error en update:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error al actualizar el producto");
    }
  }

  /**
   * Eliminar producto
   */
  async delete({ id }: { id: string }) {
    if (!id || typeof id !== "string" || id.trim() === "") {
      throw new Error("ID inválido. Debe ser una cadena no vacía");
    }

    try {
      const productoExistente = await this.productoSQLite.getById({ id });
      if (!productoExistente) {
        throw new Error("Producto no encontrado");
      }

      const producto = await this.productoSQLite.delete({ id });

      return {
        success: true,
        data: producto,
        message: "Producto eliminado exitosamente",
      };
    } catch (error) {
      console.error("Error en delete:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error al eliminar el producto");
    }
  }

  /**
   * Validar que el talle sea válido
   */
  private isValidTalle(talle: string): talle is TalleValido {
    return TALLES_VALIDOS.includes(talle as TalleValido);
  }

  /**
   * Validar datos completos del producto
   */
  private validateProductoData(data: ProductoPartial) {
    if (!data.nombre || data.nombre.trim() === "") {
      throw new Error("El nombre es requerido y no puede estar vacío");
    }

    if (!data.descripcion || data.descripcion.trim() === "") {
      throw new Error("La descripción es requerida y no puede estar vacía");
    }

    if (!data.precio || data.precio <= 0) {
      throw new Error("El precio es requerido y debe ser mayor a 0");
    }

    if (data.stock === undefined || data.stock < 0) {
      throw new Error("El stock es requerido y no puede ser negativo");
    }

    if (!data.talle || data.talle.trim() === "") {
      throw new Error("El talle es requerido y no puede estar vacío");
    }

    // Agregar validación de talle válido
    if (!this.isValidTalle(data.talle.trim())) {
      throw new Error(`El talle debe ser uno de: ${TALLES_VALIDOS.join(", ")}`);
    }

    if (!data.marca || data.marca.trim() === "") {
      throw new Error("La marca es requerida y no puede estar vacía");
    }

    if (!data.imagen || data.imagen.trim() === "") {
      throw new Error("La imagen es requerida y no puede estar vacía");
    }

    const imageUrlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))$/i;
    if (!imageUrlRegex.test(data.imagen.trim())) {
      throw new Error("La imagen debe ser una URL válida de imagen");
    }

    if (data.nombre.trim().length > 100) {
      throw new Error("El nombre no puede exceder 100 caracteres");
    }

    if (data.descripcion.trim().length > 500) {
      throw new Error("La descripción no puede exceder 500 caracteres");
    }

    if (data.marca.trim().length > 50) {
      throw new Error("La marca no puede exceder 50 caracteres");
    }

    if (data.talle.trim().length > 10) {
      throw new Error("El talle no puede exceder 10 caracteres");
    }
  }

  /**
   * Validar datos parciales del producto (para actualización)
   */
  private validatePartialProductoData(data: Partial<Producto>) {
    if (data.nombre !== undefined) {
      if (typeof data.nombre !== "string" || data.nombre.trim() === "") {
        throw new Error("El nombre debe ser una cadena no vacía");
      }
      if (data.nombre.trim().length > 100) {
        throw new Error("El nombre no puede exceder 100 caracteres");
      }
    }

    if (data.descripcion !== undefined) {
      if (
        typeof data.descripcion !== "string" || data.descripcion.trim() === ""
      ) {
        throw new Error("La descripción debe ser una cadena no vacía");
      }
      if (data.descripcion.trim().length > 500) {
        throw new Error("La descripción no puede exceder 500 caracteres");
      }
    }

    if (data.precio !== undefined) {
      if (typeof data.precio !== "number" || data.precio <= 0) {
        throw new Error("El precio debe ser un número mayor a 0");
      }
    }

    if (data.stock !== undefined) {
      if (typeof data.stock !== "number" || data.stock < 0) {
        throw new Error("El stock debe ser un número no negativo");
      }
    }

    if (data.talle !== undefined) {
      if (typeof data.talle !== "string" || data.talle.trim() === "") {
        throw new Error("El talle debe ser una cadena no vacía");
      }
      // ✅ Agregar validación de talle válido
      if (!this.isValidTalle(data.talle.trim())) {
        throw new Error(
          `El talle debe ser uno de: ${TALLES_VALIDOS.join(", ")}`,
        );
      }
      if (data.talle.trim().length > 10) {
        throw new Error("El talle no puede exceder 10 caracteres");
      }
    }

    if (data.marca !== undefined) {
      if (typeof data.marca !== "string" || data.marca.trim() === "") {
        throw new Error("La marca debe ser una cadena no vacía");
      }
      if (data.marca.trim().length > 50) {
        throw new Error("La marca no puede exceder 50 caracteres");
      }
    }

    if (data.imagen !== undefined) {
      if (typeof data.imagen !== "string" || data.imagen.trim() === "") {
        throw new Error("La imagen debe ser una cadena no vacía");
      }
      const imageUrlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))$/i;
      if (!imageUrlRegex.test(data.imagen.trim())) {
        throw new Error("La imagen debe ser una URL válida de imagen");
      }
    }

    if (data.userId !== undefined) {
      if (typeof data.userId !== "string" || data.userId.trim() === "") {
        throw new Error("El userId debe ser una cadena no vacía");
      }
    }
  }

  /**
   * Limpiar datos del producto
   */
  private cleanProductoData(data: ProductoPartial): ProductoPartial {
    return {
      ...data,
      nombre: data.nombre?.trim(),
      descripcion: data.descripcion?.trim(),
      talle: data.talle?.trim() as TalleValido | undefined,
      marca: data.marca?.trim(),
      imagen: data.imagen?.trim(),
    };
  }

  /**
   * Limpiar datos parciales del producto
   */
  private cleanPartialProductoData(data: Partial<Producto>): Partial<Producto> {
    const cleaned: Partial<Producto> = { ...data };

    if (cleaned.nombre) cleaned.nombre = cleaned.nombre.trim();
    if (cleaned.descripcion) cleaned.descripcion = cleaned.descripcion.trim();
    if (cleaned.talle) {
      cleaned.talle = cleaned.talle.trim() as typeof cleaned.talle;
    }
    if (cleaned.marca) cleaned.marca = cleaned.marca.trim();
    if (cleaned.imagen) cleaned.imagen = cleaned.imagen.trim();
    if (cleaned.userId) cleaned.userId = cleaned.userId.trim();

    return cleaned;
  }
}
