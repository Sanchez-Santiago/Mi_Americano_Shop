import { ProductoSQLite } from "../model/ProductoSQLite.ts";
import {
  Producto,
  ProductoPartial,
  productoPartialSchema,
} from "../schemas/producto.ts";

export class ProductoController {
  private productoSQLite: ProductoSQLite;

  constructor() {
    this.productoSQLite = new ProductoSQLite();
  }

  /**
   * Obtener todos los productos
   */
  async getAll() {
    try {
      const productos = await this.productoSQLite.getProductoAll();
      return productos; // Retorna directamente los datos
    } catch (error) {
      console.error("Error en getAll:", error);
      throw new Error("Error al obtener los productos");
    }
  }

  /**
   * Obtener producto por ID
   */
  async getById({ id }: { id: number }) {
    // Validar ID
    if (!id || typeof id !== "number" || id <= 0) {
      throw new Error("ID inválido. Debe ser un número positivo");
    }

    try {
      const producto = await this.productoSQLite.getProducto({ id });

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      return producto; // Retorna directamente los datos
    } catch (error) {
      console.error("Error en getById:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error al obtener el producto");
    }
  }

  /**
   * Obtener producto por nombre
   */
  async getByName({ name }: { name: string }) {
    // Validar nombre
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new Error("Nombre inválido. Debe ser una cadena no vacía");
    }

    try {
      const producto = await this.productoSQLite.getProductoByName({
        name: name.trim(),
      });

      if (!producto) {
        throw new Error("Producto no encontrado");
      }

      return producto; // Retorna directamente los datos
    } catch (error) {
      console.error("Error en getByName:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error al obtener el producto por nombre");
    }
  }

  /**
   * Crear nuevo producto
   */
  async create({ data }: { data: ProductoPartial }) {
    try {
      // Validar datos de entrada usando el schema
      const validatedData = productoPartialSchema.parse(data);

      // Validaciones adicionales de negocio
      this.validateProductoData(validatedData);

      // Limpiar datos
      const cleanedData = this.cleanProductoData(validatedData);

      const producto = await this.productoSQLite.createProducto({
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
  async update({ id, data }: { id: number; data: Partial<Producto> }) {
    // Validar ID
    if (!id || typeof id !== "number" || id <= 0) {
      throw new Error("ID inválido. Debe ser un número positivo");
    }

    // Validar que se proporcionen datos para actualizar
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      throw new Error("Debe proporcionar al menos un campo para actualizar");
    }

    try {
      // Verificar que el producto existe
      const productoExistente = await this.productoSQLite.getProducto({ id });
      if (!productoExistente) {
        throw new Error("Producto no encontrado");
      }

      // Validar campos individuales si están presentes
      this.validatePartialProductoData(data);

      // Limpiar datos parciales
      const cleanedData = this.cleanPartialProductoData(data);

      // Crear objeto completo para la actualización asegurando que todas las propiedades estén definidas
      const updatedProducto: Producto = {
        id: productoExistente.id,
        nombre: cleanedData.nombre ?? productoExistente.nombre,
        descripcion: cleanedData.descripcion ?? productoExistente.descripcion,
        precio: cleanedData.precio ?? productoExistente.precio,
        stock: cleanedData.stock ?? productoExistente.stock,
        talle: cleanedData.talle ?? productoExistente.talle,
        marca: cleanedData.marca ?? productoExistente.marca,
        imagen: cleanedData.imagen ?? productoExistente.imagen,
      };

      const producto = await this.productoSQLite.updateProducto({
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
  async delete({ id }: { id: number }) {
    // Validar ID
    if (!id || typeof id !== "number" || id <= 0) {
      throw new Error("ID inválido. Debe ser un número positivo");
    }

    try {
      // Verificar que el producto existe antes de eliminarlo
      const productoExistente = await this.productoSQLite.getProducto({ id });
      if (!productoExistente) {
        throw new Error("Producto no encontrado");
      }

      const producto = await this.productoSQLite.deleteProducto({ id });

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
   * Validar datos completos del producto
   */
  private validateProductoData(data: ProductoPartial) {
    // Validar campos requeridos
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

    if (!data.marca || data.marca.trim() === "") {
      throw new Error("La marca es requerida y no puede estar vacía");
    }

    if (!data.imagen || data.imagen.trim() === "") {
      throw new Error("La imagen es requerida y no puede estar vacía");
    }

    // Validar formato de URL de imagen (básico)
    const imageUrlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))$/i;
    if (!imageUrlRegex.test(data.imagen.trim())) {
      throw new Error("La imagen debe ser una URL válida de imagen");
    }

    // Validar longitud de strings
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
        typeof data.descripcion !== "string" ||
        data.descripcion.trim() === ""
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
  }

  /**
   * Limpiar datos del producto
   */
  private cleanProductoData(data: ProductoPartial): ProductoPartial {
    return {
      ...data,
      nombre: data.nombre?.trim(),
      descripcion: data.descripcion?.trim(),
      talle: data.talle?.trim(),
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
    if (cleaned.talle) cleaned.talle = cleaned.talle.trim();
    if (cleaned.marca) cleaned.marca = cleaned.marca.trim();
    if (cleaned.imagen) cleaned.imagen = cleaned.imagen.trim();

    return cleaned;
  }
}
