import { sqlite } from "../db/sqlite.ts";
import { UserCreate, UserSecure, UserUpdate } from "../schemas/user.ts";
import { ModelDB } from "../interface/model.ts";
import { config } from "dotenv";

config({ export: true });

export class UserSQLite implements ModelDB<UserSecure> {
  connection = sqlite;

  /**
   * Agrega un nuevo usuario
   */
  async add({ input }: { input: UserCreate }): Promise<UserSecure> {
    try {
      const result = await sqlite.execute({
        sql: `INSERT INTO user (id,name, email, password, tel, role)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          input.id,
          input.name,
          input.email,
          input.password,
          input.tel,
          input.role,
        ],
      });

      const id = String(result.lastInsertRowid);

      return {
        id,
        name: input.name,
        email: input.email,
        tel: input.tel,
      };
    } catch (error) {
      this.handleError("crear el usuario", error);
    }
  }

  /**
   * Actualiza un usuario por ID
   */
  async update({
    id,
    input,
  }: {
    id: string;
    input: Partial<UserUpdate>;
  }): Promise<UserSecure> {
    try {
      await sqlite.execute({
        sql: `UPDATE user
              SET email = ?, name = ?, tel = ?
              WHERE id = ?`,
        args: [
          input.email ?? "",
          input.name ?? "",
          input.tel ?? "",
          id,
        ],
      });

      return await this.getById({ id }) as UserSecure;
    } catch (error) {
      this.handleError("actualizar el usuario", error);
    }
  }

  /**
   * Elimina un usuario por ID
   */
  async delete({ id }: { id: string }): Promise<boolean> {
    try {
      await sqlite.execute({
        sql: `DELETE FROM user WHERE id = ?`,
        args: [id],
      });

      return true;
    } catch (error) {
      this.handleError("eliminar el usuario", error);
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  async getById({ id }: { id: string }): Promise<UserSecure | null> {
    try {
      const { rows } = await sqlite.execute({
        sql: `SELECT id, name, email, tel FROM user WHERE id = ?`,
        args: [id],
      });

      if (rows?.length) {
        const [row] = rows;
        return {
          id: String(row.id),
          name: String(row.name),
          email: String(row.email),
          tel: String(row.tel),
        };
      }

      return null;
    } catch (error) {
      this.handleError("obtener el usuario", error);
    }
  }

  /**
   * Obtiene todos los usuarios paginados
   */
  async getAll({
    page = 1,
    limit = 10,
  }: {
    page?: number;
    limit?: number;
  }): Promise<UserSecure[] | null> {
    try {
      const offset = (page - 1) * limit;

      const { rows } = await sqlite.execute({
        sql: `SELECT id, name, email, tel FROM user LIMIT ? OFFSET ?`,
        args: [limit, offset],
      });

      if (!rows?.length) return null;

      return rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        tel: String(row.tel),
      }));
    } catch (error) {
      this.handleError("obtener los usuarios", error);
    }
  }

  /**
   * Busca usuarios por nombre
   */
  async getName({
    name,
    page = 1,
    limit = 10,
  }: {
    name: string;
    page?: number;
    limit?: number;
  }): Promise<UserSecure[] | null> {
    try {
      const offset = (page - 1) * limit;

      const { rows } = await sqlite.execute({
        sql: `SELECT id, name, email, tel FROM user
              WHERE LOWER(name) LIKE LOWER(?)
              LIMIT ? OFFSET ?`,
        args: [`%${name}%`, limit, offset],
      });

      if (!rows?.length) return null;

      return rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        tel: String(row.tel),
      }));
    } catch (error) {
      this.handleError("buscar usuarios por nombre", error);
    }
  }

  /**
   * Maneja errores con logs según entorno
   */
  private handleError(action: string, error: unknown): never {
    const dev = Deno.env.get("DEV");
    console.error(
      dev === "development" ? `Error al ${action}:` : `Error al ${action}`,
    );
    console.error(error);
    throw new Error(`No se pudo ${action}`);
  }
}
