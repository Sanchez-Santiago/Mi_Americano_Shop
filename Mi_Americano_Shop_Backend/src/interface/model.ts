export interface ModelDB<T, U = T> {
  connection: unknown;

  getAll: (params: {
    page?: number;
    limit?: number;
    name?: string;
    email?: string;
  }) => Promise<U[] | undefined>;

  getById: ({ id }: { id: string }) => Promise<U | undefined>;

  add: (params: {
    input: T;
  }) => Promise<U>;

  update: (params: {
    id: string;
    input: Partial<U>; // permitís patches parciales
  }) => Promise<U | undefined>;

  delete: (params: {
    id: string;
  }) => Promise<boolean>;
}
