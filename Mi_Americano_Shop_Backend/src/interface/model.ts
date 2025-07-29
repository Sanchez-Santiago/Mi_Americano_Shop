export interface ModelDB<T, U = T> {
  connection: unknown;

  getAll: (params: {
    page?: number;
    limit?: number;
    name?: string;
    email?: string;
  }) => Promise<U[] | null>;

  getById: (params: { id: string }) => Promise<U | null>;

  add: (params: { input: T }) => Promise<U>;

  update: (params: {
    id: string;
    input: Partial<T>;
  }) => Promise<U>;

  delete: (params: { id: string }) => Promise<boolean>;
}
