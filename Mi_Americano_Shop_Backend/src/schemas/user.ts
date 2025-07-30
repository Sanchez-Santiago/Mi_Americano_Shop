import { z } from "zod";

// Enum de roles válidos
export const RoleEnum = z.enum(["admin", "cliente", "vendedor"]);

// Esquema base
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  tel: z.string().regex(/^\+?\d{10,15}$/, "Número telefónico inválido"),
  name: z.string().min(2).max(100),
  role: RoleEnum,
});

// Esquemas derivados
export const UserSecureSchema = UserSchema.omit({ password: true, role: true });
export const UserCreateSchema = UserSchema;
export const UserUpdateSchema = UserSchema.partial().strip();
export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});
export const UserResponseSchema = UserSchema.omit({ password: true });

// Tipos TypeScript
export type User = z.infer<typeof UserCreateSchema>;
export type UserSecure = z.infer<typeof UserSecureSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type Role = z.infer<typeof RoleEnum>;
