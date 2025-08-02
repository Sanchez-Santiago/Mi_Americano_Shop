type Role = "admin" | "vendedor" | string;

interface AuthContext {
  userId: string; // viene del JWT validado
  role: Role; // viene del JWT validado
}

export interface ModelDB<T, U = T> {
  connection: unknown;

  getAll: (params: {
    context: AuthContext;
    page?: number;
    limit?: number;
    name?: string;
    email?: string;
    precio?: number;
    talle?: string;
    vendedorId?: string; // solo se usa si context.role === 'admin'
  }) => Promise<U[] | null>;

  getById: (params: {
    id: string;
    context: AuthContext;
  }) => Promise<U | undefined>;

  add: (params: {
    input: T;
  }) => Promise<U>;

  update: (params: {
    id: string;
    input: Partial<U>; // permitís patches parciales
    context: AuthContext;
  }) => Promise<U | undefined>;

  delete: (params: {
    id: string;
    context: AuthContext;
  }) => Promise<boolean>;
}
