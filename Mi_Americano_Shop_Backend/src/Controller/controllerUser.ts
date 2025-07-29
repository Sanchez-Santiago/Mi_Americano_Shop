import type { ModelDB } from "../interface/model.ts";
import { User, UserSecure } from "../schemas/user.ts";

/**
 * Controlador para gestionar operaciones relacionadas con usuarios.
 */
export class UserController {
  private userModel: ModelDB<User, UserSecure>;

  constructor(userModel: ModelDB<User, UserSecure>) {
    this.userModel = userModel;
  }

  /**
   * Obtener todos los usuarios, con filtros opcionales y paginación.
   */
  async getAll(params: {
    name?: string;
    email?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const usuarios = await this.userModel.getAll(params);
      return usuarios;
    } catch (error) {
      console.error("Error en getAll:", error);
      throw new Error("Error al obtener los usuarios");
    }
  }

  /**
   * Obtener usuario por su ID.
   */
  async getById({ id }: { id: string }) {
    if (!id || typeof id !== "string" || id.trim() === "") {
      throw new Error("ID inválido. Debe ser una cadena no vacía");
    }

    try {
      const usuario = await this.userModel.getById({ id });

      if (!usuario) {
        throw new Error("Usuario no encontrado");
      }

      return usuario;
    } catch (error) {
      console.error("Error en getById:", error);
      throw new Error("Error al obtener el usuario");
    }
  }

  /**
   * Crear un nuevo usuario.
   */
  async create({ data }: { data: User }) {
    try {
      const validatedData = UserCreateSchema.parse(data);

      const nuevoUsuario = await this.userModel.add({
        input: validatedData,
      });

      return {
        success: true,
        data: nuevoUsuario,
        message: "Usuario creado exitosamente",
      };
    } catch (error) {
      console.error("Error en create:", error);
      throw new Error("Error al crear el usuario");
    }
  }

  /**
   * Actualizar un usuario existente por su ID.
   */
  async update({ id, data }: { id: string; data: Partial<User> }) {
    if (!id || typeof id !== "string" || id.length === 0) {
      throw new Error("ID inválido. Debe ser una cadena no vacía");
    }

    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      throw new Error("Debe proporcionar al menos un campo para actualizar");
    }

    try {
      const usuarioExistente = await this.userModel.getById({ id });
      if (!usuarioExistente) {
        throw new Error("Usuario no encontrado");
      }

      const updatedUser: User = {
        id: usuarioExistente.id,
        name: data.name ?? usuarioExistente.name,
        email: data.email ?? usuarioExistente.email,
        password: data.password ?? usuarioExistente.password,
        tel: data.tel ?? usuarioExistente.tel,
        role: data.role ?? usuarioExistente.role,
      };

      const usuarioActualizado = await this.userModel.update({
        id,
        input: updatedUser,
      });

      return {
        success: true,
        data: usuarioActualizado,
        message: "Usuario actualizado exitosamente",
      };
    } catch (error) {
      console.error("Error en update:", error);
      throw new Error("Error al actualizar el usuario");
    }
  }

  /**
   * Eliminar un usuario por su ID.
   */
  async delete({ id }: { id: string }) {
    if (!id || typeof id !== "string" || id.trim() === "") {
      throw new Error("ID inválido. Debe ser una cadena no vacía");
    }

    try {
      const usuarioExistente = await this.userModel.getById({ id });
      if (!usuarioExistente) {
        throw new Error("Usuario no encontrado");
      }

      const eliminado = await this.userModel.delete({ id });

      return {
        success: true,
        data: eliminado,
        message: "Usuario eliminado exitosamente",
      };
    } catch (error) {
      console.error("Error en delete:", error);
      throw new Error("Error al eliminar el usuario");
    }
  }
}
