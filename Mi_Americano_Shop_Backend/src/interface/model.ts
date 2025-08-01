export interface ModelDB<T, U = T> {
  connection: unknown;

  getAll: (params: {
    page?: number;
    limit?: number;
    name?: string;
    email?: string;
    precio?: number;
    talle?: string;
    vendedor?: string;
  }) => Promise<U[] | null>;

  getById: (params: { id: string }) => Promise<U | undefined>;

  add: (params: { input: T }) => Promise<U>;

  update: (params: {
    id: string;
    input: T; // Cambiado de Partial<T> a T para mayor consistencia
  }) => Promise<U | undefined>;

  delete: (params: { id: string }) => Promise<boolean>;
}
