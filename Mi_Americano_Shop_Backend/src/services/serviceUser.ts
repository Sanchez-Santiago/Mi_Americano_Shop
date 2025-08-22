import type { ModelDB } from "../interface/model.ts";
import {
  User,
  UserCreate,
  UserSecure,
  UserSecureSchema,
  UserUpdate,
} from "../schemas/user.ts";
import { uuid } from "uuid";
import { hash } from "bcrypt";
import { Role } from "../types/AuthContext.ts";

/**
 * Servicio para gestionar operaciones relacionadas con usuarios.
 */
export class UserService {
  private userModel: ModelDB<User>;

  constructor(userModel: ModelDB<User>) {
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

  async getByIdAuth({ id }: { id: string }) {
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
  async create({ data }: { data: UserCreate }) {
    try {
      const user = {
        id: uuid(),
        name: data.name,
        tel: data.tel,
        email: data.email,
        password: await hash(data.password),
        role: "cliente" as Role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const nuevoUsuario = await this.userModel.add({
        input: user,
      });

      const userFinal = await this.userModel.getById({
        id: nuevoUsuario.id,
      });
      return {
        success: true,
        data: userFinal as UserSecure,
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
  async update({ id, data }: { id: string; data: Partial<UserUpdate> }) {
    try {
      const usuarioExistente = await this.userModel.getById({ id });
      if (!usuarioExistente) {
        throw new Error("Usuario no encontrado");
      }
      const usuarioActualizado = await this.userModel.update({
        id,
        input: data,
      });

      const userFinal: UserSecure = UserSecureSchema.parse(usuarioActualizado);

      return {
        success: true,
        data: userFinal,
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
    try {
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
