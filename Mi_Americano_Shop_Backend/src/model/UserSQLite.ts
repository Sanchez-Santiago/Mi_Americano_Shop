import { sqlite } from "../db/sqlite.ts";
import { User, UserUpdate } from "../schemas/user.ts";
import { UserModelDB } from "../interface/UserModel.ts";
import { config } from "dotenv";
import type { Role } from "../types/AuthContext.ts";

config({ export: true });

export class UserSQLite implements UserModelDB {
  connection = sqlite;

  /**
   * Agrega un nuevo usuario
   */
  async add({ input }: { input: User }): Promise<User> {
    try {
      const result = await sqlite.execute({
        sql: `INSERT INTO user (id, name, email, password, tel, role)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          input.id,
          input.name,
          input.email,
          input.password,
          input.tel,
          input.role || "cliente",
        ],
      });

      const id = String(result.lastInsertRowid);

      return {
        id,
        name: String(input.name),
        email: String(input.email),
        password: String(input.password),
        tel: String(input.tel),
        role: String(input.role) as Role,
      };
    } catch (error) {
      this.handleError("crear el usuario DB", error);
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
  }): Promise<User> {
    try {
      const user = await this.getById({ id });
      if (!user) throw new Error("Usuario no encontrado");

      await sqlite.execute({
        sql: `UPDATE user
              SET email = ?, name = ?, tel = ?, password = ?
              WHERE id = ?`,
        args: [
          input.email ?? user.email,
          input.name ?? user.name,
          input.tel ?? user.tel,
          input.password ?? user.password,
          id,
        ],
      });

      return await this.getById({ id }) as User;
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
  async getById({ id }: { id: string }): Promise<User | undefined> {
    try {
      const { rows } = await sqlite.execute({
        sql: `SELECT id, name, email, tel FROM user WHERE id = ?`,
        args: [id],
      });

      if (rows?.length) {
        const [row] = rows;
        return {
          id: String(row.id),
          password: String(row.password),
          name: String(row.name),
          email: String(row.email),
          role: String(row.role) as Role,
          tel: String(row.tel),
        };
      }

      return undefined;
    } catch (error) {
      this.handleError("obtener el usuario DB", error);
    }
  }

  async getByEmail({ email }: { email: string }): Promise<User | undefined> {
    try {
      const { rows } = await sqlite.execute({
        sql: `SELECT id, name, email, password, tel, role
          FROM user
          WHERE LOWER(email) = LOWER(?)`,
        args: [email.toLowerCase()],
      });

      if (rows?.length) {
        const [row] = rows;
        return {
          id: String(row.id),
          password: String(row.password),
          name: String(row.name),
          email: String(row.email),
          role: String(row.role) as Role,
          tel: String(row.tel),
        };
      }

      return undefined;
    } catch (error) {
      this.handleError("obtener el usuario DB", error);
    }
  }

  /**
   * Obtiene una lista paginada de usuarios con filtros opcionales por nombre y correo.
   *
   * @param name - (Opcional) Filtro parcial por nombre (ej. "Juan" buscará "%Juan%").
   * @param email - (Opcional) Filtro parcial por email (ej. "@gmail.com").
   * @param page - Número de página (por defecto 1).
   * @param limit - Cantidad de resultados por página (por defecto 10).
   * @returns Lista de usuarios o null si no hay resultados.
   */
  async getAll({
    name = "",
    email = "",
    page = 1,
    limit = 10,
  }: {
    name?: string;
    email?: string;
    page?: number;
    limit?: number;
  }): Promise<User[] | undefined> {
    try {
      const offset = (page - 1) * limit;
      const filters: string[] = [];
      const args: (string | number)[] = [];

      // Armado dinámico de filtros SQL
      if (name) {
        filters.push("name LIKE ?");
        args.push(`%${name}%`);
      }

      if (email) {
        filters.push("email LIKE ?");
        args.push(`%${email}%`);
      }

      // Construcción del WHERE si hay filtros
      const whereClause = filters.length > 0
        ? `WHERE ${filters.join(" AND ")}`
        : "";

      // Agregamos paginación al final
      const query = `
        SELECT id, name, email, tel, role
        FROM user
        ${whereClause}
        LIMIT ? OFFSET ?
      `;

      args.push(limit, offset);

      const { rows } = await sqlite.execute({
        sql: query,
        args,
      });

      if (!rows || rows.length === 0) return undefined;

      return rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        email: String(row.email),
        password: String(row.password),
        tel: String(row.tel),
        role: String(row.role) as Role,
      }));
    } catch (error) {
      this.handleError("obtener los usuarios DB", error);
      return undefined;
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
