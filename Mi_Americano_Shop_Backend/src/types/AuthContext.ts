// types.ts

export type Role = "admin" | "vendedor" | "cliente";

export interface AuthContext {
  userId: string;
  role: Role;
}
