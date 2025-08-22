import type { ModelDB } from "../interface/model.ts";
import { UserService } from "../services/serviceUser.ts";
import {
  User,
  UserCreateSchema,
  UserSecure,
  UserUpdate,
} from "../schemas/user.ts";
import { config } from "dotenv";
import { AuthContext } from "../types/AuthContext.ts";

config({ export: true });
/**
 * Controlador para gestionar operaciones relacionadas con usuarios.
 */
export class UserController {
  private userModel: ModelDB<User>;
  private userService: UserService;
  constructor(userModel: ModelDB<User>) {
    this.userModel = userModel;
    this.userService = new UserService(this.userModel);
  }

  /**
   * Obtener todos los usuarios, con filtros opcionales y paginación.
   */
  async getAll(params: {
    name?: string;
    email?: string;
    page?: number;
    limit?: number;
    user: AuthContext;
  }) {
    try {
      const userIdAuth = String(params.user.userId);
      if (userIdAuth !== params.user.userId) {
        throw new Error("No tienes permiso para realizar esta acción");
      }
      const userExistente = this.userModel.getById({ id: userIdAuth });
      if (!userExistente) {
        throw new Error("Usuario no encontrado");
      }
      const usuarios = await this.userService.getAll(params);
      return usuarios as UserSecure[];
    } catch (error) {
      printError(error);
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
      const usuario = await this.userService.getById({ id });

      if (!usuario) {
        throw new Error("Usuario no encontrado Controler");
      }

      return usuario as UserSecure;
    } catch (error) {
      printError(error);
      throw new Error("Error al obtener el usuario");
    }
  }

  /**
   * Crear un nuevo usuario.
   */
  async create({ data }: { data: User }) {
    try {
      const validatedData = UserCreateSchema.parse(data);

      const nuevoUsuario = await this.userService.create({
        data: validatedData,
      });

      return nuevoUsuario;
    } catch (error) {
      printError(error);
      throw new Error("Error al crear el usuario");
    }
  }

  /**
   * Actualizar un usuario existente por su ID.
   */
  async update({ id, data }: { id: string; data: Partial<UserUpdate> }) {
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

      // Validar y convertir el role de manera segura
      const validateRole = (role: string): "admin" | "cliente" | "vendedor" => {
        if (role === "admin" || role === "cliente" || role === "vendedor") {
          return role;
        }
        throw new Error(
          `Rol inválido: ${role}. Debe ser uno de: admin, cliente, vendedor`,
        );
      };

      const updatedUser: User = {
        id: id,
        name: data.name ? String(data.name) : usuarioExistente.name,
        email: data.email ? String(data.email) : usuarioExistente.email,
        password: data.password
          ? String(data.password)
          : usuarioExistente.password, // Mantener contraseña existente
        tel: data.tel ? String(data.tel) : usuarioExistente.tel,
        role: data.role ? validateRole(String(data.role)) : "cliente", // Valor por defecto
      };

      const usuarioActualizado = await this.userService.update({
        id,
        data: updatedUser,
      });

      return usuarioActualizado;
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

      const eliminado = await this.userService.delete({ id });

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

function printError(error: unknown): void {
  const dev = Deno.env.get("ENV");
  if (dev) {
    console.error("Error:", error);
  }
}
